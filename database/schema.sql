-- Scout Planner Database Schema

CREATE TABLE groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- clan, comunita_capi
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'ragazzi', -- admin, capi, staff, ragazzi
    group_id INTEGER REFERENCES groups(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL, -- riunione, uscita, campo, consiglio
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    location VARCHAR(255),
    group_id INTEGER REFERENCES groups(id),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending', -- pending, in_progress, completed
    priority VARCHAR(50) DEFAULT 'medium', -- low, medium, high
    due_date TIMESTAMP,
    assigned_to INTEGER REFERENCES users(id),
    created_by INTEGER REFERENCES users(id),
    event_id INTEGER REFERENCES events(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserimento dati di esempio
INSERT INTO groups (name, type, description) VALUES 
('Clan Aquile', 'clan', 'Clan scout principale'),
('Comunità Capi', 'comunita_capi', 'Comunità dei capi educatori');

INSERT INTO users (email, name, hashed_password, role, group_id) VALUES 
('admin@scout.it', 'Admin Scout', '$2b$12$hash', 'admin', 1),
('capo@scout.it', 'Capo Gruppo', '$2b$12$hash', 'capi', 1);