-- simple mysql/mariadb schema for object persistence

-- current objects in the notebook
CREATE TABLE current_objects (
  obj_id BIGINT NOT NULL PRIMARY KEY,
  obj_type VARCHAR(255) NOT NULL,
  -- msgpacked object data
  obj_data MEDIUMBLOB NOT NULL
);

-- oplog, a history of every single object write in the notebook
CREATE TABLE oplog (
  oplog_id BIGINT NOT NULL PRIMARY KEY,
  obj_id BIGINT NOT NULL,
  obj_type VARCHAR(255) NOT NULL,
  -- msgpacked object data, null if this entry signifies a deletion
  data MEDIUMBLOB
);
