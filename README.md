
```
npm install
npm start
```

### Use /client folder to test client (index.html on dev web server)

# Use HTTP for no encryption on game traffic and HTTPS only on Store pages
```
/*
https://nginx.org/en/docs/http/websocket.html
Add to /opt/bitnami/nginx/conf/nginx.conf for HTTP server
cd /opt/bitnami/nginx/conf/server_blocks/
nano default-https-server-block.conf
(if over HTTPS)

        //Restart nginx after changes
        sudo /opt/bitnami/ctlscript.sh restart

        #Websockets/socket.io Setup
        location /ws/ {
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header Host $host;

            proxy_pass http://localhost:3000;

            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
       }

*/
```