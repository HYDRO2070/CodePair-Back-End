require('dotenv').config();

const express = require("express")
const cors = require("cors")
const bcrypt = require("bcrypt")
const User = require("../models/User")
const mongoose = require("mongoose")
const jwt = require("jsonwebtoken")
const axios = require("axios")

const app = express()

app.use(express.json())
const PORT = process.env.PORT || 3000; // Vercel uses 3000 by default
// app.use(cors({
//     origin: 'http://localhost:3000'
// }))
// const PORT = 3030

// process.env.JWT_SECRECT

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => {
        console.log("MongoDb connected .....");
    })
    .catch((err) => {
        console.error("mongoDB connection error : ", err);
    })


const Problem = mongoose.model('Problem', new mongoose.Schema({}, { collection: 'problems' }));


app.get('/', (req, res) => {
    try {
        res.status(200).json({mesaage:"hello world');
    } catch (error) {
        console.error('Error in /api/example:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.post('/api/signup', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const euser = await User.findOne({ email });
        if (euser) {
            return res.status(400).json({ message: 'User already exits' });
        }

        const hashpass = await bcrypt.hash(password, 10);

        const newUser = new User({
            username,
            email,
            password: hashpass,
        })

        await newUser.save();
        console.log("User register sucess")
        res.status(201).json({ message: "user register ...." })
    } catch (error) {
        res.status(500).json({ message: " Error registering User" })
        console.log(" Error registering User")
    }
})


app.post('/api/login', async (req, res) => {
    console.log(req.body)
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid email id" })
        }

        const ispassword = await bcrypt.compare(password, user.password);
        if (!ispassword) {
            return res.status(400).json({ message: "Invalid email Password" })
        }

        const token = jwt.sign(
            { userID: user._id, email: user.email },
            process.env.JWT_SECRECT,
            { expiresIn: '1h' }
        )

        console.log("Login ......")
        res.json({ token, user: { username: user.username, email: user.email } });
    } catch (error) {
        console.log("login error")
        res.status(500).json({ message: 'Server Error' });
    }
})


const authMiddleware = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];

    if (!token) {
        console.log("No token, autheorization denied")
        return res.status(401).json({ message: "No token, autheorization denied" })
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRECT);

        req.user = decoded;

        next();
    } catch (err) {
        console.log("Invalid token")
        res.status(401).json({ message: "Invalid token" })
    }
};


app.get('/mainpage', authMiddleware, (req, res) => {
    res.json({
        message: `Welcome ${req.user.email} to your dashboard`,
        user: req.user
    });
});


app.get('/api/problemset', async (req, res) => {
    try {
        const problem = await Problem.find({});
        // console.log(problem)

        // console.log(problem)
        console.log("problem send")
        res.status(200).json(problem)
    } catch (error) {
        console.log("error loading the problem")
        res.status(500).json({ message: "error loading the problem" })
    }
})

app.get('/api/problem/:id', async (req, res) => {
    const proId = req.params.id;
    try {
        const problem = await Problem.findById(proId);
        if (!problem) {
            console.log("problem NOt found")
            return res.status(404).json({ error: "Problem not found" })
        }
        console.log("problem------- send")
        res.json(problem);
    } catch (error) {
        console.log("problem nOt send")
        return res.status(500).json({ error: "Server error" })
    }
})


app.post('/api/run-code', async (req, res) => {
    const { code, language, bottom, test_case } = req.body;
    const top = '#include<bits/stdc++.h>\n#include <vector>\n#include <unordered_map>\nusing namespace std;\n';
    let edit_bottom = bottom
    for (const [key, value] of Object.entries(test_case)) {
        edit_bottom = edit_bottom.replace(key, JSON.stringify(value).replace('[', '').replace(']', '').replace('"', '').replace('"', ''))
    }
    const new_code = top + code + edit_bottom;
    // console.log(new_code,test_case)
    // console.log(new_code)
    // console.log(code, language)
    // const API_URL = 'https://judge0.p.rapidapi.com/submissions';
    try {
        // const response = await axios.post('')
        const options = {
            method: 'POST',
            // url: `${API_URL}?base64_encoded=false&wait=true`,
            url: `https://judge0-ce.p.rapidapi.com/submissions?fields=*`,
            headers: {
                'Content-Type': 'application/json',
                'x-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
                'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
            },
            data: {
                source_code: new_code,
                language_id: language,
                stdin: '',
            }
        };


        const response = await axios.request(options);
        console.log('token:', response.data)

        const token = response.data.token;

        const checkstatus = setInterval(async () => {

            const option = {
                method: 'GET',
                url: `https://judge0-ce.p.rapidapi.com/submissions/${token}?base64_encoded=true&fields=*`,
                headers: {
                    'x-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
                    'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
                },
            };

            const result = await axios.request(option);
            console.log(result)
            const { status, stdout, stderr, compile_output } = result.data;
            if (status.id === 3) {
                clearInterval(checkstatus);
                res.json({ output: stdout });
            }
            else if (status.id >= 6) {
                clearInterval(checkstatus);
                if (stderr) {
                    res.json({ error: stderr });
                }
                else if (compile_output) {
                    res.json({ error: compile_output });
                }
                else {
                    res.json({ error: "Unknown error occurred!" });
                }
            }
        }, 2000);



        // res.json({
        //     token: response.data.token,
        //     // stderr: response.data.stderr,
        //     // status: response.data.status.description,
        // });
    } catch (err) {
        console.log(err)
        // console.log("token failed to load")
        res.status(500).json({ error: "Execution Failed ." })
    }
});



async function checkSubmission(token) {
    return new Promise((resolve, reject) => {
        const checkstatus = setInterval(async () => {
            const option = {
                method: 'GET',
                url: `https://judge0-ce.p.rapidapi.com/submissions/${token}?base64_encoded=true&fields=*`,
                headers: {
                    'x-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
                    'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
                },
            };

            const result = await axios.request(option);
            const { status, stdout, stderr, compile_output, time, memory } = result.data;

            if (status.id === 3) {
                clearInterval(checkstatus);
                resolve({ stdout, time, memory });
            } else if (status.id >= 6) {
                clearInterval(checkstatus);
                console.log("-------")
                reject(stderr || compile_output || "Unknown error occurred!");
            }
        }, 2000);
    });
}





app.use('/api/submission', async (req, res) => {
    // const { code, language, bottom, test_case } = req.body;
    // const temp = {
    //     nums = [1,2,3,4],target =9
    // }
    // let keyi = test_case[1].input
    // let bot = bottom
    // for (const [key, value] of Object.entries(keyi)) {
    //     bot = bot.replace(key, JSON.stringify(value).replace('[', '').replace(']', '').replace('"', '').replace('"', ''))
    // }
    // let nums = [1,2,3,4];
    // let new_nums = nums.join(', ')
    // let tar = 3;
    // let new_bottom = bottom.replace("nums_value",new_nums)
    // console.log(keyi)
    // console.log(bot)

    const { code, language, bottom, test_case } = req.body;
    let testpass = 0;
    let time_taken = 0;
    let memory_taken = 0;

    try {
        console.log("i am here");
        const top = '#include<bits/stdc++.h>\n#include <vector>\n#include <unordered_map>\nusing namespace std;\n';

        for (let index = 0; index < test_case.length; index++) {
            let prob_t = test_case[index];

            let edit_bottom = bottom
            for (const [key, value] of Object.entries(prob_t.input)) {
                edit_bottom = edit_bottom.replace(key, JSON.stringify(value).replace('[', '').replace(']', '').replace('"', '').replace('"', ''))
            }

            const new_code = top + code + edit_bottom;

            try {
                const options = {
                    method: 'POST',
                    url: `https://judge0-ce.p.rapidapi.com/submissions?fields=*`,
                    headers: {
                        'Content-Type': 'application/json',
                        'x-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
                        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
                    },
                    data: {
                        source_code: new_code,
                        language_id: language,
                        stdin: '',
                    }
                };

                const response = await axios.request(options);
                console.log('token:', response.data);
                const token = response.data.token;

                let result = await checkSubmission(token);
                if (result) {
                    const { stdout, time, memory } = result;
                    // stdout = atob(stdout)
                    let new_out = atob(stdout)
                    let otp = JSON.stringify(prob_t.output);
                    console.log(stdout, time, memory,new_out,otp)
                    console.log(new_out.includes(otp))
                    if (new_out.includes(otp)) {
                        time_taken += time;
                        memory_taken += memory;
                        testpass += 1;
                    } else {
                        return res.json({ testpass:testpass, input_string: JSON.stringify(prob_t.input)});
                    }
                }

            } catch (err) {
                console.log((err));
                return res.status(500).json({ error: err });
            }
        }
        return res.json({ testpass:testpass, time: time_taken, memory: memory_taken });

    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Execution Failed." });
    }

    




    // res.json({ output: "recivied here" });

})


app.post('/api/saveproblem', async (req, res) => {
    const { username, problemTitle, difficulty } = req.body;

    if (!username || !problemTitle || !difficulty) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        // Find the user by username
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Add the problem title to the solvedProblems array if it's not already there
        if (!user.solvedProblems.includes(problemTitle)) {
            user.solvedProblems.push(problemTitle);
        }

        // Update the difficulty counts
        if (difficulty === 'easy') {
            user.solvedCounts.easy += 1;
        } else if (difficulty === 'medium') {
            user.solvedCounts.medium += 1;
        } else if (difficulty === 'hard') {
            user.solvedCounts.hard += 1;
        } else {
            return res.status(400).json({ message: 'Invalid difficulty level' });
        }

        // Save the updated user document
        await user.save();

        res.status(200).json({ message: 'Problem saved successfully' });
    } catch (error) {
        console.error('Error saving problem:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});



app.get('/api/profile/:username', async (req, res) => {
    const { username } = req.params;

    try {
        // Find the user by username
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Construct the response manually
        const responseData = {
            username: user.username,
            profileImage: user.profileImage || 'https://i.pinimg.com/736x/fa/d5/e7/fad5e79954583ad50ccb3f16ee64f66d.jpg', // Default image URL
            createdAt: user.createdAt,
            bio: user.bio || 'No bio available.',
            solvedCounts: {
                easy: user.solvedCounts.easy,
                medium: user.solvedCounts.medium,
                hard: user.solvedCounts.hard
            },
            solvedProblems: user.solvedProblems
        };

        // Send the constructed response
        res.status(200).json(responseData);
    } catch (error) {
        console.error('Error fetching user details:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});




// app.get('/result/:token',async(req,res)=>{
//     const {token} = req.params;
//     try{

//         const options = {
//             method: 'GET',
//             url: `https://judge0-ce.p.rapidapi.com/submissions/${token}?base64_encoded=true&fields=*`,
//             headers:{
//                 'x-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
//                 'X-RapidAPI-Key' : process.env.RAPIDAPI_KEY,
//             },
//         };

//         const response = await axios.request(options);
//         console.log('status :',response.data)


//         if(response.data.status.id === 3){
//             res.json({
//                 stdout:response.data.stdout,
//                 stderr:response.data.stderr,
//                 time:response.data.time,
//                 memory:response.data.memory,
//             });
//         }
//         else{
//             res.json({status:response.data.status.description});
//         }
//     } catch(err){
//         // console.log(err)
//         console.log("execition failed")
//         res.status(500).json({error:"error while executing code"})
//     }
// });


app.get('/api/test', (req, res) => {
    res.json({ message: "This text is from Backeden!" })
})

module.exports = app;
