const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 3000;
const DATA_FILE = path.join(__dirname, "movies.json");

// Read movies from file
function readMovies() {
    try {
        const data = fs.readFileSync(DATA_FILE, "utf8");

        if (!data) {
            return [];
        }

        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

// Save movies to file
function saveMovies(movies) {
    fs.writeFileSync(
        DATA_FILE,
        JSON.stringify(movies, null, 2),
        "utf8"
    );
}

// Send JSON response
function sendResponse(res, statusCode, data) {
    res.writeHead(statusCode, {
        "Content-Type": "application/json"
    });

    res.end(JSON.stringify(data));
}

const server = http.createServer((req, res) => {

    // GET ALL MOVIES
    if (req.method === "GET" && req.url === "/movies") {

        const movies = readMovies();

        return sendResponse(res, 200, movies);
    }

    // GET MOVIE BY ID
    if (
        req.method === "GET" &&
        req.url.startsWith("/movies/")
    ) {

        const id = parseInt(req.url.split("/")[2]);

        const movies = readMovies();

        const movie = movies.find(movie => movie.id === id);

        if (!movie) {
            return sendResponse(res, 404, {
                message: "Movie not found"
            });
        }

        return sendResponse(res, 200, movie);
    }

    // CREATE MOVIE
    if (
        req.method === "POST" &&
        req.url === "/movies"
    ) {

        let body = "";

        req.on("data", chunk => {
            body += chunk.toString();
        });

        req.on("end", () => {

            try {

                const newMovie = JSON.parse(body);

                const movies = readMovies();

                const movie = {
                    id: Date.now(),
                    title: newMovie.title,
                    review: newMovie.review,
                    rating: newMovie.rating
                };

                movies.push(movie);

                saveMovies(movies);

                return sendResponse(res, 201, {
                    message: "Movie added successfully",
                    movie
                });

            } catch (error) {

                return sendResponse(res, 400, {
                    message: "Invalid JSON data"
                });
            }
        });

        return;
    }

    // UPDATE MOVIE
    if (
        req.method === "PUT" &&
        req.url.startsWith("/movies/")
    ) {

        const id = parseInt(req.url.split("/")[2]);

        let body = "";

        req.on("data", chunk => {
            body += chunk.toString();
        });

        req.on("end", () => {

            try {

                const updatedData = JSON.parse(body);

                const movies = readMovies();

                const index = movies.findIndex(
                    movie => movie.id === id
                );

                if (index === -1) {
                    return sendResponse(res, 404, {
                        message: "Movie not found"
                    });
                }

                movies[index] = {
                    ...movies[index],
                    ...updatedData
                };

                saveMovies(movies);

                return sendResponse(res, 200, {
                    message: "Movie updated successfully",
                    movie: movies[index]
                });

            } catch (error) {

                return sendResponse(res, 400, {
                    message: "Invalid JSON data"
                });
            }
        });

        return;
    }

    // DELETE MOVIE
    if (
        req.method === "DELETE" &&
        req.url.startsWith("/movies/")
    ) {

        const id = parseInt(req.url.split("/")[2]);

        const movies = readMovies();

        const movie = movies.find(
            movie => movie.id === id
        );

        if (!movie) {
            return sendResponse(res, 404, {
                message: "Movie not found"
            });
        }

        const updatedMovies = movies.filter(
            movie => movie.id !== id
        );

        saveMovies(updatedMovies);

        return sendResponse(res, 200, {
            message: "Movie deleted successfully"
        });
    }

    // Route not found
    sendResponse(res, 404, {
        message: "Route not found"
    });
});

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});