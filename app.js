var im = require("imagemagick"),
    fs = require("fs"),
    http = require("http"),
    remoteRequest = require("request"),
    port = process.env.PORT || 3000,
    indexhtml = fs.readFileSync("index.html", "binary"),
    favicon = fs.readFileSync("favicon.ico", "binary");

http.createServer(function (request, response) {
    var options = {
            uri: request.url.slice(1),
            method: "GET",
            headers: {
                "Accept": "image/*",
                "Accept-Charset": "*",
                "Accept-Language": request.headers["Accept-Language"] || request.headers["accept-language"],
                "Cache-Control": request.headers["Cache-Control"] || request.headers["cache-control"],
                "Connection": "close",
                "Host": "twiki.cj.com",
                "Pragma": "no-cache",
                "User-Agent": request.headers["User-Agent"] || request.headers["user-agent"]
            },
            jar: false,
            strictSSL: false,
            encoding: null
        };

    request.on("data", function (chunk) {
        options.body = (options.body || "") + chunk.toString();
    });

    request.on("end", function () {
        if (options.uri === "favicon.ico") {
            response.writeHead(200, {});
            response.write(favicon, "binary");
            response.end();
        } else if (options.uri === "") {
            response.writeHead(200, {"Content-Type": "text/html"});
            response.write(indexhtml);
            response.end();
        } else if (options.uri.indexOf("http") !== 0) {
            response.writeHead(302, {"Location": "/"});
            response.end();
        } else {
            remoteRequest(options, function (error, remoteResponse, body) {
                var responseHeaders = (remoteResponse ? remoteResponse.headers : {}),
                    statusCode = (remoteResponse ? remoteResponse.statusCode : 404);

                delete responseHeaders.Connection;
                responseHeaders.connection = "close";

                if (statusCode === 200) {
                    var proc = im.convert(['-', '-format', 'JPEG', '-flatten', '-quality', '1', '-'], function (err, stdout, stderr) {
                        delete responseHeaders["Content-Length"];
                        responseHeaders["content-length"] = stdout.length;

                        response.writeHead(statusCode, responseHeaders);
                        response.write(stdout, "binary");
                        response.end();
                    });

                    proc.stdin.setEncoding('binary');
                    proc.stdin.write(body, 'binary');
                    proc.stdin.end();
                } else {
                    response.writeHead(302, {"Location": "/"});
                    response.end();
                }
            });
        }
    });
}).listen(port, function () {
    console.log("Listening on " + port);
});
