# AI & Optimization Engine Architecture

This document details the "Brain" of the platform: a hybrid engine combining **Constraint Programming (CP)** for scheduling and **Machine Learning (ML)** for predictive analytics.

## 🧠 Module 1: The Assignor (Optimization)

**Technology**: Google OR-Tools (CP-SAT Solver) provided via a FastAPI Microservice.

### The Problem
Assign $N$ games to $M$ ampayers such that all games are covered, rules are respected, and total "cost" (travel + unfairness) is minimized.

### 1. Inputs
-   **Games ($G$)**: Set of games with `{id, location, datetime, category, required_level}`.
-   **Ampayers ($A$)**: Set of officials with `{id, home_location, certification_level, availability_blocks, past_assignments}`.
-   **Distance Matrix ($D_{ij}$)**: Travel time between Home Locations and Stadiums.

### 2. Decision Variables
-   $x_{g,a} \in \{0, 1\}$: 1 if Ampayer $a$ is assigned to Game $g$, 0 otherwise.

### 3. Hard Constraints (Must Satisfy)
1.  **Coverage**: Each game must have exactly 2 ampayers (or strict number required).
    $$ \sum_{a \in A} x_{g,a} = 2, \quad \forall g \in G $$
2.  **Availability**: Ampayer cannot be assigned if marked "Busy" during game time.
3.  **No Overlap**: Ampayer cannot be in two games at the same time (plus buffer time).
    $$ x_{g1,a} + x_{g2,a} \le 1 \quad \text{if } |time(g1) - time(g2)| < 2h $$
4.  **Certification**: Ampayer level must matches Game category.
    $$ x_{g,a} = 0 \quad \text{if } level(a) < required\_level(g) $$

### 4. Soft Constraints (Optimize)
Minimize the Objective Function $Z$:

$$ Z = \alpha \sum (TravelTime) + \beta \sum (WorkloadImbalance) + \gamma \sum (PreferenceViolations) $$

-   **Travel Time**: Minimize total km driven.
-   **Workload**: StdDev of games assigned per ampayer should be low.
-   **Rotation**: Avoid assigning the same ampayer to the same Team > 2 times in a row.

---

## 🔮 Module 2: The Oracle (Predictive ML)

**Technology**: Scikit-Learn / PyTorch.

### Feature 1: Game Cancellation Risk
Predict probability of a game being cancelled/forfeited.
-   **Features**: Weather forecast, Team History (past forfeits), Field Condition, Pay Status.
-   **Output**: Risk Score (0-100%).
-   **Action**: High risk -> Do not assign top-tier ampayers (save them for sure games).

### Feature 2: Match Difficulty Rating
Estimate technical difficulty of a game to assign better refs.
-   **Features**: Rivalry Intensity (History), Team Standing (1st vs 2nd), Past Ejections count.
-   **Action**: High difficulty -> Constraint `required_level` raised to "Expert".

---

## 🔄 Integration Flow

1.  **Trigger**: Admin clicks "Optimize Weekend".
2.  **Extract**: Django serializes Game/User data -> JSON.
3.  **Process**: FastAPI receives JSON -> Builds OR-Tools Model -> Solves.
4.  **Response**: Returns list of assignments `[{game_id: 1, ampayer_id: 5}, ...]`.
5.  **Review**: Admin sees "Suggested" state assignments.
6.  **Learn**: If Admin overrides AI, log the delta for parameter tuning.
