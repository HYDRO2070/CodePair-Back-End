# CodePair

Welcome to **CodePair**, your go-to platform for honing your Data Structures and Algorithms (DSA) skills! Our platform offers a wide range of coding problems for users to solve and test their programming skills.

## Features

- **User Authentication**: Sign up and log in securely to track your progress.
- **Problem Sets**: Access a diverse set of problems categorized by difficulty (easy, medium, hard).
- **Real-Time Code Execution**: Write and run your code in various programming languages.
- **Submission Tracking**: Check the results of your code submissions and view outputs, errors, and performance metrics.
- **User Profiles**: View profiles with user statistics, including solved problems and achievements.

## Technology Stack

- **Frontend**: (Mention any technologies/frameworks used)
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Authentication**: JSON Web Tokens (JWT)
- **Code Execution**: Integrated with Judge0 API for real-time code evaluation.

## Getting Started

To get started with CodePair, follow these steps:

1. Clone the repository:
    ```bash
    git clone https://github.com/yourusername/codepair.git
    cd codepair
    ```

2. Install the dependencies:
    ```bash
    npm install
    ```

3. Set up your environment variables by creating a `.env` file in the root directory and adding your MongoDB URI and RapidAPI key:
    ```
    MONGO_URI=your_mongodb_uri
    RAPIDAPI_KEY=your_rapidapi_key
    JWT_SECRET=your_jwt_secret
    ```

4. Start the server:
    ```bash
    npm start
    ```

5. Access the application at `http://localhost:3000`.

## API Endpoints

- **POST /api/signup**: Create a new user.
- **POST /api/login**: Authenticate a user and receive a token.
- **GET /api/problemset**: Retrieve all problems.
- **GET /api/problem/:id**: Get a specific problem by ID.
- **POST /api/run-code**: Execute code and get the output.
- **GET /api/profile/:username**: View user profile and statistics.

## Contributing

Contributions are welcome! If you'd like to contribute to CodePair, please fork the repository and create a pull request.

## License

This project is licensed under the MIT License.

## Demo

Check out the live version of CodePair at [CodePair](https://codepair.vercel.app/).

---

Feel free to reach out for any questions or suggestions!
