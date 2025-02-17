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