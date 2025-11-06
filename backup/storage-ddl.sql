-- "storage".buckets definition

-- Drop table

-- DROP TABLE "storage".buckets;

CREATE TABLE "storage".buckets (
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
CREATE UNIQUE INDEX bname ON storage.buckets USING btree (name);

-- Table Triggers

create trigger enforce_bucket_name_length_trigger before
insert
    or
update
    of name on
    storage.buckets for each row execute function storage.enforce_bucket_name_length();


-- "storage".buckets_analytics definition

-- Drop table

-- DROP TABLE "storage".buckets_analytics;

CREATE TABLE "storage".buckets_analytics (
	id text NOT NULL,
	"type" "storage"."buckettype" DEFAULT 'ANALYTICS'::storage.buckettype NOT NULL,
	format text DEFAULT 'ICEBERG'::text NOT NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT buckets_analytics_pkey PRIMARY KEY (id)
);


-- "storage".migrations definition

-- Drop table

-- DROP TABLE "storage".migrations;

CREATE TABLE "storage".migrations (
	id int4 NOT NULL,
	"name" varchar(100) NOT NULL,
	hash varchar(40) NOT NULL,
	executed_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	CONSTRAINT migrations_name_key UNIQUE (name),
	CONSTRAINT migrations_pkey PRIMARY KEY (id)
);


-- "storage".objects definition

-- Drop table

-- DROP TABLE "storage".objects;

CREATE TABLE "storage".objects (
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
	user_metadata jsonb NULL,
	"level" int4 NULL,
	CONSTRAINT objects_pkey PRIMARY KEY (id),
	CONSTRAINT "objects_bucketId_fkey" FOREIGN KEY (bucket_id) REFERENCES "storage".buckets(id)
);
CREATE UNIQUE INDEX bucketid_objname ON storage.objects USING btree (bucket_id, name);
CREATE UNIQUE INDEX idx_name_bucket_level_unique ON storage.objects USING btree (name COLLATE "C", bucket_id, level);
CREATE INDEX idx_objects_bucket_id_name ON storage.objects USING btree (bucket_id, name COLLATE "C");
CREATE INDEX idx_objects_lower_name ON storage.objects USING btree ((path_tokens[level]), lower(name) text_pattern_ops, bucket_id, level);
CREATE INDEX name_prefix_search ON storage.objects USING btree (name text_pattern_ops);
CREATE UNIQUE INDEX objects_bucket_id_level_idx ON storage.objects USING btree (bucket_id, level, name COLLATE "C");

-- Table Triggers

create trigger objects_delete_delete_prefix after
delete
    on
    storage.objects for each row execute function storage.delete_prefix_hierarchy_trigger();
create trigger objects_insert_create_prefix before
insert
    on
    storage.objects for each row execute function storage.objects_insert_prefix_trigger();
create trigger objects_update_create_prefix before
update
    on
    storage.objects for each row
    when (((new.name <> old.name)
        or (new.bucket_id <> old.bucket_id))) execute function storage.objects_update_prefix_trigger();
create trigger update_objects_updated_at before
update
    on
    storage.objects for each row execute function storage.update_updated_at_column();


-- "storage".prefixes definition

-- Drop table

-- DROP TABLE "storage".prefixes;

CREATE TABLE "storage".prefixes (
	bucket_id text NOT NULL,
	"name" text COLLATE "C" NOT NULL,
	"level" int4 GENERATED ALWAYS AS (storage.get_level(name)) STORED NOT NULL,
	created_at timestamptz DEFAULT now() NULL,
	updated_at timestamptz DEFAULT now() NULL,
	CONSTRAINT prefixes_pkey PRIMARY KEY (bucket_id, level, name),
	CONSTRAINT "prefixes_bucketId_fkey" FOREIGN KEY (bucket_id) REFERENCES "storage".buckets(id)
);
CREATE INDEX idx_prefixes_lower_name ON storage.prefixes USING btree (bucket_id, level, ((string_to_array(name, '/'::text))[level]), lower(name) text_pattern_ops);

-- Table Triggers

create trigger prefixes_create_hierarchy before
insert
    on
    storage.prefixes for each row
    when ((pg_trigger_depth() < 1)) execute function storage.prefixes_insert_trigger();
create trigger prefixes_delete_hierarchy after
delete
    on
    storage.prefixes for each row execute function storage.delete_prefix_hierarchy_trigger();


-- "storage".s3_multipart_uploads definition

-- Drop table

-- DROP TABLE "storage".s3_multipart_uploads;

CREATE TABLE "storage".s3_multipart_uploads (
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
CREATE INDEX idx_multipart_uploads_list ON storage.s3_multipart_uploads USING btree (bucket_id, key, created_at);


-- "storage".s3_multipart_uploads_parts definition

-- Drop table

-- DROP TABLE "storage".s3_multipart_uploads_parts;

CREATE TABLE "storage".s3_multipart_uploads_parts (
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