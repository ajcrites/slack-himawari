'use strict';
const fs = require("fs");
const http = require("http");
const connect = require("connect");
const app = connect();
const himawari = require("himawari");

app.use(require("body-parser").urlencoded({extended: true}));
app.use((req, res) => {
    const proto = req.headers["x-forwarded-proto"] || "http";
    const host = req.headers["host"] || "localhost";
    const hostname = `${proto}://${host}`;

    if ("/" === req.url) {
        res.setHeader("Content-Type", "application/json");
        if (req.body.token !== process.env.SLACK_TOKEN) {
            res.writeHead(401);
            return res.end('{"error":"invalid token"}');
        }
        const filename = `himawari-${Date.now()}.jpg`;
        const outfile = `./images/${filename}`;

        himawari({
            outfile,
            success() {
                res.end(JSON.stringify({
                    text: "",
                    attachments: [{
                        fallback: "Couldn't show the earth :(",
                        image_url: `${hostname}/${filename}`,
                    }],
                }));
            },
            error(err) {
                console.error(err.stack);
                res.writeHead(500);
                res.end('{"error":"server error"}');
            },
        });
    }
    else {
        const stream = fs.createReadStream(`./images${req.url}`);
        stream.on("open", () => stream.pipe(res));
        stream.on("error", () => {
            res.setHeader("Content-Type", "application/json");
            res.writeHead(404);
            res.end('{"error":"not found"}');
        });
    }
});

const server = http.createServer(app);
server.listen(process.env.PORT || 3000);