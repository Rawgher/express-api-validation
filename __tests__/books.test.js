process.env.NODE_ENV = "test"

const request = require("supertest");


const app = require("../app");
const db = require("../db");


// isbn of sample book
let book_isbn;


beforeEach(async () => {
  let result = await db.query(`
    INSERT INTO
      books (isbn, amazon_url,author,language,pages,publisher,title,year)
      VALUES(
        '13241122',
        'https://amazon.com/book',
        'THoward',
        'English',
        500,
        'Xbox publishers',
        'this book', 2020)
      RETURNING isbn`);

  book_isbn = result.rows[0].isbn
});

afterEach(async function () {
    await db.query("DELETE FROM BOOKS");
});
  
  
afterAll(async function () {
    await db.end()
});


describe("POST /books", function () {
  test("Creates a new book", async function () {
    const response = await request(app)
        .post(`/books`)
        .send({
          isbn: '141256566',
          amazon_url: "https://amazon.com/book2",
          author: "NAuth",
          language: "english",
          pages: 400,
          publisher: "sony publisher",
          title: "another book",
          year: 2021
        });
    expect(response.statusCode).toBe(201);
    expect(response.body.book).toHaveProperty("isbn");
  });

  test("Prevents creating book without required title", async function () {
    const response = await request(app)
        .post(`/books`)
        .send({year: 2021});
    expect(response.statusCode).toBe(400);
  });
});


describe("GET /books", function () {
  test("Gets a list of 1 book", async function () {
    const response = await request(app).get(`/books`);
    const books = response.body.books;
    expect(books).toHaveLength(1);
    expect(books[0]).toHaveProperty("isbn");
    expect(books[0]).toHaveProperty("amazon_url");
  });
});


describe("GET /books/:isbn", function () {
  test("Gets a single book", async function () {
    const response = await request(app)
        .get(`/books/${book_isbn}`)
    expect(response.body.book).toHaveProperty("isbn");
    expect(response.body.book.isbn).toBe(book_isbn);
  });

  test("Responds with 404 if can't find book in question", async function () {
    const response = await request(app)
        .get(`/books/123`)
    expect(response.statusCode).toBe(404);
  });
});


describe("PUT /books/:id", function () {
  test("Updates a single book", async function () {
    const response = await request(app)
        .put(`/books/${book_isbn}`)
        .send({
          amazon_url: "https://amazon.com/newurl",
          author: "Ttest",
          language: "english",
          pages: 10,
          publisher: "other pub",
          title: "New Book",
          year: 2019
        });
    expect(response.body.book).toHaveProperty("isbn");
    expect(response.body.book.title).toBe("New Book");
  });

  test("Prevents a bad book update", async function () {
    const response = await request(app)
        .put(`/books/${book_isbn}`)
        .send({
          isbn: "32794782",
          badField: "asdfjlkjaslkdf",
          amazon_url: "asfdasdfsadf",
          author: "Ttest",
          language: "english",
          pages: 10,
          publisher: "other pub",
          title: "New Book",
          year: 2019
        });
    expect(response.statusCode).toBe(400);
  });

  test("Responds 404 if can't find book in question", async function () {
    // delete book first
    await request(app)
        .delete(`/books/${book_isbn}`)
    const response = await request(app).delete(`/books/${book_isbn}`);
    expect(response.statusCode).toBe(404);
  });
});


describe("DELETE /books/:id", function () {
  test("Deletes a single a book", async function () {
    const response = await request(app)
        .delete(`/books/${book_isbn}`)
    expect(response.body).toEqual({message: "Book deleted"});
  });
});