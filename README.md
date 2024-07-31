# Financial Statement Visualization

This project is a financial statement visualization tool that fetches financial data for companies and displays trends and comparisons. The backend fetches data from the SEC API and serves it to the frontend, which visualizes the data using charts.

###Link
https://financial-statement-visualization-1.onrender.com/

## Table of Contents

- [Project Structure](#project-structure)
- [Technologies Used](#technologies-used)
- [Setup Instructions](#setup-instructions)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Deployment](#deployment)
  - [Backend Deployment](#backend-deployment)
  - [Frontend Deployment](#frontend-deployment)
- [Usage](#usage)
- [License](#license)


markdown


## Technologies Used

- **Frontend**: React, Recharts, Axios
- **Backend**: Node.js, Express, Axios
- **Deployment**: Render

## Setup Instructions

### Backend Setup

1. **Navigate to the backend directory**:
   ```bash
   cd backend

    Install dependencies:

    bash

npm install

Run the backend server:

bash

    npm start

    The server will run on http://localhost:5001.

Frontend Setup

    Navigate to the frontend directory:

    bash

cd frontend

Install dependencies:

bash

npm install

Run the frontend application:

bash

    npm start

    The application will run on http://localhost:3000.

Deployment
Backend Deployment

The backend is deployed on Render. Ensure the backend URL is correctly set in your frontend configuration.

    Commit and push your changes:

    bash

    git add .
    git commit -m "Deploy backend"
    git push origin master

    Trigger a deploy on Render.

Frontend Deployment

The frontend is also deployed on Render.

    Commit and push your changes:

    bash

    git add .
    git commit -m "Deploy frontend"
    git push origin master

    Trigger a deploy on Render.

Usage

    Access the application:
    Open your browser and navigate to the deployed frontend URL.

    Select a company:
    Use the dropdown to select a company.

    View financial data:
    The application fetches and displays the financial data for the selected company, including assets, liabilities, equity, revenue, and net income.

    Compare companies:
    Toggle the comparison mode to compare financial data of multiple companies.

    Fetch news:
    Click the "Fetch News" button to retrieve the latest financial news.

License

This project is licensed under the MIT License.

