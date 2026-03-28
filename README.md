# Fitness App

A local fitness tracking app built with Expo and React Native.

## Features

- Track body weight with input component
- Log workout sessions (exercise, weight, reps, sets)
- Analyze food photos for nutrition using Gemini AI
- Weekly workout progress bar (aim for 3 workouts)
- Automatic reminders: Strong reminder on Thursday if no workouts, stop after 3
- Weight trend chart for the last month

## Setup

1. Install dependencies: `npm install`
2. Start the app: `npm start` or use VS Code tasks

## Database

Uses Expo SQLite with two tables:
- `body_weights`: id, date, weight
- `workout_logs`: id, date, exercise_name, weight, reps, sets

## Permissions

Requires notification permissions for workout reminders.