import { Server } from "socket.io";

let connectons = {};
let messages = {};
let timeOnline = {};

const connectToSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      allowedHeaders: ["*"],
      credentials: true,
    },
  });

  io.on("connection", (Socket) => {
    console.log("New user connected:", Socket.id);

    // JOIN CALL
    Socket.on("join-call", (path) => {
      if (connectons[path] === undefined) {
        connectons[path] = [];
      }

      connectons[path].push(Socket.id);
      timeOnline[Socket.id] = new Date();
      Socket.join(path);

      console.log("Room:", path, "Users:", connectons[path]);

      for (let a = 0; a < connectons[path].length; a++) {
        io.to(connectons[path][a]).emit(
          "user-joined",
          Socket.id,
          connectons[path]
        );
      }

      if (messages[path] !== undefined) {
        for (let a = 0; a < messages[path].length; ++a) {
          io.to(Socket.id).emit(
            "chart-message",
            messages[path][a]["data"],
            messages[path][a]["sender"],
            messages[path][a]["socket-id-sender"]
          );
        }
      }
    });

    // SIGNAL
    Socket.on("signal", (toId, message) => {
      io.to(toId).emit("signal", Socket.id, message);
    });

    // CHAT MESSAGE
    Socket.on("chart-message", (data, sender) => {
      const [matchingRoom, found] = Object.entries(connectons).reduce(
        ([room, isFound], [roomKey, roomValue]) => {
          if (!isFound && roomValue.includes(Socket.id)) {
            return [roomKey, true];
          }
          return [room, isFound];
        },
        ["", false]
      );

      if (found === true) {
        if (messages[matchingRoom] === undefined) {
          messages[matchingRoom] = [];
        }

        messages[matchingRoom].push({
          sender: sender,
          data: data,
          "socket-id-sender": Socket.id,
        });

        console.log("message", matchingRoom, ":", sender, data);

        connectons[matchingRoom].forEach((elem) => {
          io.to(elem).emit("chart-message", data, sender, Socket.id);
        });
      }
    });

    // DISCONNECT
    Socket.on("disconnect", () => {
      console.log("User disconnected:", Socket.id);

      var diffTime = Math.abs(timeOnline[Socket.id] - new Date());

      var key;

      // FIXED FIRST LOOP
      for (const [k, v] of Object.entries(connectons)) {
        for (let a = 0; a < v.length; ++a) {
          if (v[a] === Socket.id) {
            key = k;

            // broadcast leave
            for (let b = 0; b < connectons[key].length; ++b) {
              io.to(connectons[key][b]).emit("user-left", Socket.id);
            }

            // remove user
            const index = connectons[key].indexOf(Socket.id);
            if (index !== -1) {
              connectons[key].splice(index, 1);
            }

            // delete room if empty
            if (connectons[key].length === 0) {
              delete connectons[key];
            }
          }
        }
      }

      // // NORMAL CLEANUP (keep same)
      // Object.keys(connectons).forEach((path) => {
      //   let users = connectons[path];

      //   const index = users.indexOf(Socket.id);

      //   if (index !== -1) {
      //     users.splice(index, 1);
      //     io.to(path).emit("user-left", Socket.id);
      //   }

      //   if (users.length === 0) {
      //     delete connectons[path];
      //   }
      // });
    });
  });
};

export default connectToSocket;
