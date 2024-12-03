CREATE TABLE recipes (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    instructions TEXT
);

CREATE TABLE ingredients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

CREATE TABLE recipe_ingredients (
    recipe_id INT,
    ingredient_id INT,
    FOREIGN KEY (recipe_id) REFERENCES recipes (id),
    FOREIGN KEY (ingredient_id) REFERENCES ingredients (id)
);

INSERT INTO recipes (title, description, instructions) VALUES 
('Spaghetti Bolognese', 'Ein klassisches Rezept.', 'Koche die Spaghetti...');

INSERT INTO ingredients (name) VALUES 
('Tomaten'), ('Hackfleisch'), ('Spaghetti'), ('Knoblauch');

INSERT INTO recipe_ingredients (recipe_id, ingredient_id) VALUES
(1, 1), (1, 2), (1, 3), (1, 4);
