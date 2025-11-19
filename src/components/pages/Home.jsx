import React, { useContext, useState } from 'react'
import withAuth from '../utils/withAuth'
import { useNavigate } from 'react-router-dom'
import "../../App";
import { Button, TextField } from '@mui/material';
import RestoreIcon from '@mui/icons-material/Restore';
import { AuthContext } from '../contexts/AuthContext';

function HomeComponent() {

    let navigate = useNavigate();
    const [meetingCode, setMeetingCode] = useState("");

    const { addToUserHistory } = useContext(AuthContext);

    let handleJoinVideoCall = async () => {
        await addToUserHistory(meetingCode)
        navigate(`/${meetingCode}`)
    }

    return (
        <div className="w-full min-h-screen bg-gray-900 text-white flex flex-col">

            {/* NAVBAR */}
            <div className="w-full bg-gray-800 py-4 px-6 flex items-center justify-between shadow-lg">

                <h2 className="text-2xl font-bold text-blue-400">Apna Video Call</h2>

                <div className="flex items-center gap-6">

                    <button
                        onClick={() => navigate("/history")}
                        className="flex items-center gap-2 hover:text-blue-400 transition"
                    >
                        <RestoreIcon />
                        <span>History</span>
                    </button>

                    <button
                        className="bg-red-600 hover:bg-red-500 transition px-4 py-2 rounded"
                        onClick={() => {
                            localStorage.removeItem("token");
                            navigate("/auth");
                        }}
                    >
                        Logout
                    </button>
                </div>
            </div>

            {/* BODY */}
            <div className="flex flex-col md:flex-row flex-grow">

                {/* LEFT PANEL */}
                <div className="flex-1 flex items-center justify-center p-10">

                    <div className="max-w-lg">

                        <h2 className="text-3xl font-bold mb-6 leading-snug">
                            Providing Quality Video Calls Just Like Quality Education
                        </h2>

                        <div className="flex gap-3">

                            <TextField
                                onChange={e => setMeetingCode(e.target.value)}
                                id="outlined-basic"
                                label="Meeting Code"
                                variant="outlined"
                                className="bg-white rounded"
                                InputProps={{
                                    style: { color: "black" }
                                }}
                            />

                            <Button
                                onClick={handleJoinVideoCall}
                                variant='contained'
                                style={{ height: "55px" }}
                            >
                                Join
                            </Button>

                        </div>
                    </div>
                </div>

                {/* RIGHT PANEL */}
                <div className="flex-1 flex items-center justify-center p-10">
                    <img
                        srcSet='/logo3.png'
                        alt="App Logo"
                        className="w-3/4 max-w-md drop-shadow-xl"
                    />
                </div>

            </div>
        </div>
    )
}

export default withAuth(HomeComponent)
