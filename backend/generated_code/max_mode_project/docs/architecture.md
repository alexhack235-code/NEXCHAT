# Architecture Overview

This project demonstrates a lightweight engineering workflow: define tasks, sort them by priority, and validate with automated tests.

## Components

- `TaskPlanner` decides which tasks should run first
- tests assert ordering and summary behavior
- CI ensures future changes do not break the core workflow

## Design Goals

- clarity
- testability
- extensibility
- fast iteration
