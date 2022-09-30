const express = require("express");
const { open } = require("sqlite");
const path = require("path");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());
let db = null;

const dbPath = path.join(__dirname, "todoApplication.db");

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server is running successfully");
    });
  } catch (e) {
    console.log(`DB error : ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

//API - 1
app.get("/todos/", async (request, response) => {
  let todoQuery = "";
  const { search_q = "", status, priority } = request.query;
  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      todoQuery = `SELECT * FROM
            todo 
            WHERE status = "${status}"
            AND priority = "${priority}"
            AND todo LIKE "%${search_q}%"
            ORDER BY id ASC;`;
      break;
    case hasPriorityProperty(request.query):
      todoQuery = `SELECT
             *
            FROM
             todo 
            WHERE priority = '${priority}'
            AND todo LIKE '%${search_q}%'
            ORDER BY id ASC;`;
      break;
    case hasStatusProperty(request.query):
      todoQuery = `SELECT 
            * 
            FROM
             todo 
            WHERE status = '${status}'
            AND todo LIKE '%${search_q}%'
            ORDER BY id ASC;`;
      break;
    default:
      todoQuery = `SELECT * FROM todo
            WHERE todo LIKE '%${search_q}%'
            ORDER BY id ASC;`;
      break;
  }
  const dbResponse = await db.all(todoQuery);
  response.send(dbResponse);
});

//API -2
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const todoQuery = `SELECT * FROM todo WHERE id = ${todoId};`;
  const dbResponse = await db.get(todoQuery);
  response.send(dbResponse);
});

//API-3
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const postTodoQuery = `INSERT INTO todo(
        id,todo,priority,status)
        VALUES (
                ${id},
           '${todo}',
            '${priority}',
            '${status}');`;

  const dbResponse = await db.run(postTodoQuery);
  response.send("Todo Successfully Added");
});

//API - 4
app.put("/todos/:todoId/", async (request, response) => {
  let putTodoQuery = null;
  let dbResponse = null;
  const { todoId } = request.params;
  const { status, priority, todo } = request.body;
  console.log(request.body);
  switch (true) {
    case hasPriorityProperty(request.body):
      putTodoQuery = `UPDATE todo SET 
          priority = '${priority}'
          WHERE id = ${todoId};`;
      dbResponse = await db.run(putTodoQuery);
      response.send("Priority Updated");
      break;
    case hasStatusProperty(request.body):
      putTodoQuery = `UPDATE todo SET 
          status = '${status}'
          WHERE id = ${todoId};`;
      dbResponse = await db.run(putTodoQuery);
      response.send("Status Updated");
      break;
    default:
      putTodoQuery = `UPDATE todo SET 
          todo = '${todo}'
          WHERE id = ${todoId};`;
      dbResponse = await db.run(putTodoQuery);
      response.send("Todo Updated");
      break;
  }
});

//API-5
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `DELETE FROM todo WHERE id LIKE ${todoId};`;
  const dbResponse = await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
