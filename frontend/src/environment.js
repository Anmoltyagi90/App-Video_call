let IS_PROD = process.env.NODE_ENV === 'production';
const server = IS_PROD ?
    "https://app-video-call-2.onrender.com" :
    "http://localhost:8080"


export default server;
