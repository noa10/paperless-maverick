-- Fix line item search functions to correctly handle column mappings and improve search accuracy

-- Drop existing functions first to avoid errors when changing return types
DROP FUNCTION IF EXISTS search_line_items(vector, double precision, int);
DROP FUNCTION IF EXISTS hybrid_search_line_items(vector, text, double precision, double precision, double precision, int, numeric, numeric, date, date);

-- Updated function to search line items using vector similarity with corrected column mapping
CREATE FUNCTION search_line_items(
  query_embedding vector(1536),
  similarity_threshold double precision DEFAULT 0.3, -- Lower threshold for better recall
  match_count int DEFAULT 10
) RETURNS TABLE (
  id uuid, -- Using raw column names to avoid ambiguity
  receipt_id uuid,
  description text,
  amount numeric,
  parent_receipt_merchant text,
  parent_receipt_date date,
  similarity double precision
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    li.id,
    li.receipt_id,
    li.description,
    li.amount,
    r.merchant as parent_receipt_merchant,
    r.date as parent_receipt_date,
    1 - (li.embedding <=> query_embedding) as similarity
  FROM
    line_items li
  JOIN
    receipts r ON li.receipt_id = r.id
  WHERE
    li.embedding IS NOT NULL
    AND (1 - (li.embedding <=> query_embedding)) > similarity_threshold
  ORDER BY
    similarity DESC
  LIMIT match_count;
END;
$$;

-- Updated hybrid search function for line items with corrected column mapping
CREATE FUNCTION hybrid_search_line_items(
  query_embedding vector(1536),
  query_text text,
  similarity_threshold double precision DEFAULT 0.3, -- Lower threshold for better recall
  similarity_weight double precision DEFAULT 0.7,
  text_weight double precision DEFAULT 0.3,
  match_count int DEFAULT 10,
  min_amount numeric DEFAULT NULL,
  max_amount numeric DEFAULT NULL,
  start_date date DEFAULT NULL,
  end_date date DEFAULT NULL
) RETURNS TABLE (
  id uuid, -- Using raw column names to avoid ambiguity
  receipt_id uuid,
  description text,
  amount numeric,
  parent_receipt_merchant text,
  parent_receipt_date date,
  similarity double precision,
  text_score double precision,
  score double precision
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  WITH vector_results AS (
    SELECT
      li.id,
      li.receipt_id,
      li.description,
      li.amount,
      r.merchant as parent_receipt_merchant,
      r.date as parent_receipt_date,
      1 - (li.embedding <=> query_embedding) as similarity
    FROM
      line_items li
    JOIN
      receipts r ON li.receipt_id = r.id
    WHERE
      li.embedding IS NOT NULL
      AND (1 - (li.embedding <=> query_embedding)) > similarity_threshold
      AND (min_amount IS NULL OR li.amount >= min_amount)
      AND (max_amount IS NULL OR li.amount <= max_amount)
      AND (start_date IS NULL OR r.date >= start_date)
      AND (end_date IS NULL OR r.date <= end_date)
  ),
  text_results AS (
    SELECT
      li.id,
      ts_rank(to_tsvector('english', coalesce(li.description, '')), plainto_tsquery('english', query_text)) as text_score
    FROM
      line_items li
    WHERE
      query_text IS NOT NULL
      AND query_text <> ''
  )
  SELECT
    vr.id,
    vr.receipt_id,
    vr.description,
    vr.amount,
    vr.parent_receipt_merchant,
    vr.parent_receipt_date,
    vr.similarity,
    COALESCE(tr.text_score, 0) as text_score,
    (vr.similarity * similarity_weight) + (COALESCE(tr.text_score, 0) * text_weight) as score
  FROM
    vector_results vr
  LEFT JOIN
    text_results tr ON vr.id = tr.id
  ORDER BY
    score DESC
  LIMIT match_count;
END;
$$; 