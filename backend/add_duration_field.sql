-- Add duration field to training_content table
ALTER TABLE training_content 
ADD COLUMN duration INTEGER DEFAULT 0;

COMMENT ON COLUMN training_content.duration IS 'Duration in seconds for videos/PDFs';
