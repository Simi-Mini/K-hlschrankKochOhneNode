from flask import Flask, request, jsonify
import mysql.connector

app = Flask(__name__)

db = mysql.connector.connect(
    host="localhost",
    user="root",
    password="admin",
    database="rezepte"
)

@app.route('/recipes', methods=['GET'])
def get_recipes():
    ingredients = request.args.getlist('ingredients')
    cursor = db.cursor(dictionary=True)

    query = """
        SELECT DISTINCT r.title, r.instructions
        FROM recipes r
        JOIN recipe_ingredients ri ON r.id = ri.recipe_id
        JOIN ingredients i ON ri.ingredient_id = i.id
        WHERE i.name IN (%s)
        GROUP BY r.id
        HAVING COUNT(DISTINCT i.id) = %s
    """
    in_clause = ', '.join(['%s'] * len(ingredients))
    cursor.execute(query % (in_clause, len(ingredients)), ingredients)
    recipes = cursor.fetchall()
    return jsonify(recipes)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
