drop database if exists taskly_db;
create database if not exists taskly_db;

use taskly_db;

create table users(
	id char(36) primary key,
    name varchar(255) not null,
    email varchar(255) not null,
    password varchar(255) not null,
    createdAt DATETIME NOT NULL,
    isVerified boolean default false,
    profile_image VARCHAR(255) DEFAULT NULL
);

create table projects(
	id char(36) primary key,
    name varchar(255) not null,
    description varchar(255) not null,
    lider_id char(36),
    createdAt DATETIME NOT NULL,
    foreign key (lider_id) references users (id)
);

create table project_users(
    user_id char(36),
    project_id char(36),
    rol enum('OWNER','WOKER','READER') default 'READER',
    foreign key (user_id) references users (id),
    foreign key (project_id) references projects (id),
    primary key (user_id, project_id)
);

create table tasks(
	id char(36) primary key,
    name varchar(255) not null,
    description varchar(255) not null,
    project_id char(36) not null,
    assigned_user_id char(36),
    status enum('TO_DO','IN_PROGRESS','DONE') default 'TO_DO',
    
    foreign key (assigned_user_id) references users (id),
    foreign key (project_id) references projects (id)
);

create table depends_from_tasks(
	dependent_task char(36),
    primary_task char(36),
    primary key (dependent_task, primary_task),
    foreign key (dependent_task) references tasks (id),
    foreign key (primary_task) references tasks (id)
);

create table task_history (
	id char(36) primary key,
    user_id char(36) not null,
    task_id char(36) not null,
    action varchar(255) not null,
    action_date datetime not null,
    foreign key (task_id) references tasks (id),
    foreign key (user_id) references users (id)
);

SET GLOBAL event_scheduler = ON;
-- Para eliminar usuarios no verificados en 1 hora
CREATE EVENT delete_unverified_users
    ON SCHEDULE EVERY 10 MINUTE
    DO
    DELETE FROM users
    WHERE isVerified = FALSE
      AND createdAt < NOW() - INTERVAL 1 HOUR;

INSERT INTO users (id, name, email, password, createdAt, isVerified)
VALUES 
    ('1dbe39dd-cb2e-4d1d-b571-4f275149d9c7', 'Pau', 'paudebionneferrer@gmail.com', '$2a$10$FiFWDzNfXgB4i2dXoKU1yuLMNfnXbUlqF7VMn7jP5hYWwUG28GUkm', '2021-06-01 00:00:00', true),
    ('4ac5953b-e2d9-4d35-9c6b-b33c3c883cb3', 'Paco', 'predatorpk25@gmail.com', '$2a$10$MxqcQ7JQEhd4y1mPmbOSU.ZIhQCKjUbF8JYJitZTxESMiDM1LIoc2', '2021-06-01 00:00:00', true),
    ('868ce5d0-4e77-406a-8500-6c65856d9975', 'paquete', 'joseantonioreyessolera@gmail.com', '$2a$10$iZ.JiDnSxdrwYXghtISJGuMPF.zZPeIvJ6AjZTU9p1wtY6dLqPS3K', '2021-06-01 00:00:00', true)
;