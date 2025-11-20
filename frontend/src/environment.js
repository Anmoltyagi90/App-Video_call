let IS_PROD = process.env.NODE_ENV === 'production';
const server = IS_PROD ?
<<<<<<< HEAD
    "https://app-video-call-2.onrender.com" :
=======
    "https://app-video-call-2.onrender.com/" :

>>>>>>> 5b6dfc0706d003d7bff029965cf375192205696d
    "http://localhost:8080"


export default server;
