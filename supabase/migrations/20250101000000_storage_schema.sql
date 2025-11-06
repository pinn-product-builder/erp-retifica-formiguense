-- Migration: Storage Schema
-- Description: Creates all storage tables, indexes, and triggers
-- Based on: backup/storage-ddl.sql

-- "storage".buckets definition
CREATE TABLE IF NOT EXISTS "storage".buckets (
	id text NOT NULL,
	"name" text NOT NULL,
	"owner" uuid NULL,
	created_at timestamptz DEFAULT now() NULL,
	updated_at timestamptz DEFAULT now() NULL,
	public bool DEFAULT false NULL,
	avif_autodetection bool DEFAULT false NULL,
	file_size_limit int8 NULL,
	allowed_mime_types _text NULL,
	owner_id text NULL,
	"type" "storage"."buckettype" DEFAULT 'STANDARD'::storage.buckettype NOT NULL,
	CONSTRAINT buckets_pkey PRIMARY KEY (id)
);
CREATE UNIQUE INDEX IF NOT EXISTS bname ON storage.buckets USING btree (name);

-- Table Triggers
DROP TRIGGER IF EXISTS enforce_bucket_name_length_trigger ON storage.buckets;
CREATE TRIGGER enforce_bucket_name_length_trigger BEFORE
INSERT
    OR
UPDATE
    OF name ON
    storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.enforce_bucket_name_length();


-- "storage".buckets_analytics definition
CREATE TABLE IF NOT EXISTS "storage".buckets_analytics (
	id text NOT NULL,
	"type" "storage"."buckettype" DEFAULT 'ANALYTICS'::storage.buckettype NOT NULL,
	format text DEFAULT 'ICEBERG'::text NOT NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT buckets_analytics_pkey PRIMARY KEY (id)
);


-- "storage".migrations definition
CREATE TABLE IF NOT EXISTS "storage".migrations (
	id int4 NOT NULL,
	"name" varchar(100) NOT NULL,
	hash varchar(40) NOT NULL,
	executed_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	CONSTRAINT migrations_name_key UNIQUE (name),
	CONSTRAINT migrations_pkey PRIMARY KEY (id)
);


-- "storage".objects definition
CREATE TABLE IF NOT EXISTS "storage".objects (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	bucket_id text NULL,
	"name" text NULL,
	"owner" uuid NULL,
	created_at timestamptz DEFAULT now() NULL,
	updated_at timestamptz DEFAULT now() NULL,
	last_accessed_at timestamptz DEFAULT now() NULL,
	metadata jsonb NULL,
	path_tokens _text GENERATED ALWAYS AS (string_to_array(name, '/'::text)) STORED NULL,
	"version" text NULL,
	owner_id text NULL,
	"level" int4 NULL,
	CONSTRAINT objects_pkey PRIMARY KEY (id),
	CONSTRAINT "objects_bucketId_fkey" FOREIGN KEY (bucket_id) REFERENCES "storage".buckets(id)
);
CREATE UNIQUE INDEX IF NOT EXISTS bucketid_objname ON storage.objects USING btree (bucket_id, name);
CREATE UNIQUE INDEX IF NOT EXISTS idx_name_bucket_level_unique ON storage.objects USING btree (name COLLATE "C", bucket_id, level);
CREATE INDEX IF NOT EXISTS idx_objects_bucket_id_name ON storage.objects USING btree (bucket_id, name COLLATE "C");
CREATE INDEX IF NOT EXISTS idx_objects_lower_name ON storage.objects USING btree ((path_tokens[level]), lower(name) text_pattern_ops, bucket_id, level);
CREATE INDEX IF NOT EXISTS name_prefix_search ON storage.objects USING btree (name text_pattern_ops);
CREATE UNIQUE INDEX IF NOT EXISTS objects_bucket_id_level_idx ON storage.objects USING btree (bucket_id, level, name COLLATE "C");

-- Table Triggers
DROP TRIGGER IF EXISTS objects_delete_delete_prefix ON storage.objects;
CREATE TRIGGER objects_delete_delete_prefix AFTER
DELETE
    ON
    storage.objects FOR EACH ROW EXECUTE FUNCTION storage.delete_prefix_hierarchy_trigger();

DROP TRIGGER IF EXISTS objects_insert_create_prefix ON storage.objects;
CREATE TRIGGER objects_insert_create_prefix BEFORE
INSERT
    ON
    storage.objects FOR EACH ROW EXECUTE FUNCTION storage.objects_insert_prefix_trigger();

DROP TRIGGER IF EXISTS objects_update_create_prefix ON storage.objects;
CREATE TRIGGER objects_update_create_prefix BEFORE
UPDATE
    ON
    storage.objects FOR EACH ROW
    WHEN (((new.name <> old.name)
        OR (new.bucket_id <> old.bucket_id))) EXECUTE FUNCTION storage.objects_update_prefix_trigger();

DROP TRIGGER IF EXISTS update_objects_updated_at ON storage.objects;
CREATE TRIGGER update_objects_updated_at BEFORE
UPDATE
    ON
    storage.objects FOR EACH ROW EXECUTE FUNCTION storage.update_updated_at_column();


-- "storage".prefixes definition
CREATE TABLE IF NOT EXISTS "storage".prefixes (
	bucket_id text NOT NULL,
	"name" text COLLATE "C" NOT NULL,
	"level" int4 GENERATED ALWAYS AS (storage.get_level(name)) STORED NOT NULL,
	created_at timestamptz DEFAULT now() NULL,
	updated_at timestamptz DEFAULT now() NULL,
	CONSTRAINT prefixes_pkey PRIMARY KEY (bucket_id, level, name),
	CONSTRAINT "prefixes_bucketId_fkey" FOREIGN KEY (bucket_id) REFERENCES "storage".buckets(id)
);
CREATE INDEX IF NOT EXISTS idx_prefixes_lower_name ON storage.prefixes USING btree (bucket_id, level, ((string_to_array(name, '/'::text))[level]), lower(name) text_pattern_ops);

-- Table Triggers
DROP TRIGGER IF EXISTS prefixes_create_hierarchy ON storage.prefixes;
CREATE TRIGGER prefixes_create_hierarchy BEFORE
INSERT
    ON
    storage.prefixes FOR EACH ROW
    WHEN ((pg_trigger_depth() < 1)) EXECUTE FUNCTION storage.prefixes_insert_trigger();

DROP TRIGGER IF EXISTS prefixes_delete_hierarchy ON storage.prefixes;
CREATE TRIGGER prefixes_delete_hierarchy AFTER
DELETE
    ON
    storage.prefixes FOR EACH ROW EXECUTE FUNCTION storage.delete_prefix_hierarchy_trigger();


-- "storage".s3_multipart_uploads definition
CREATE TABLE IF NOT EXISTS "storage".s3_multipart_uploads (
	id text NOT NULL,
	in_progress_size int8 DEFAULT 0 NOT NULL,
	upload_signature text NOT NULL,
	bucket_id text NOT NULL,
	"key" text COLLATE "C" NOT NULL,
	"version" text NOT NULL,
	owner_id text NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	user_metadata jsonb NULL,
	CONSTRAINT s3_multipart_uploads_pkey PRIMARY KEY (id),
	CONSTRAINT s3_multipart_uploads_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES "storage".buckets(id)
);
CREATE INDEX IF NOT EXISTS idx_multipart_uploads_list ON storage.s3_multipart_uploads USING btree (bucket_id, key, created_at);


-- "storage".s3_multipart_uploads_parts definition
CREATE TABLE IF NOT EXISTS "storage".s3_multipart_uploads_parts (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	upload_id text NOT NULL,
	"size" int8 DEFAULT 0 NOT NULL,
	part_number int4 NOT NULL,
	bucket_id text NOT NULL,
	"key" text COLLATE "C" NOT NULL,
	etag text NOT NULL,
	owner_id text NULL,
	"version" text NOT NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT s3_multipart_uploads_parts_pkey PRIMARY KEY (id),
	CONSTRAINT s3_multipart_uploads_parts_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES "storage".buckets(id),
	CONSTRAINT s3_multipart_uploads_parts_upload_id_fkey FOREIGN KEY (upload_id) REFERENCES "storage".s3_multipart_uploads(id) ON DELETE CASCADE
);

