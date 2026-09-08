from flask import Flask, jsonify, request
import mysql.connector
from mysql.connector import Error
import pandas as pd
import os
import heapq

app = Flask(__name__)

# ============================================================
# MYSQL CONFIGURATION
# ============================================================

MYSQL_HOST = "localhost"
MYSQL_USER = "root"
MYSQL_PASSWORD = "YOUR_MYSQL_PASSWORD"
MYSQL_DATABASE = "railway_system"

EXCEL_FILE = "database.xlsx"


# ============================================================
# MYSQL CONNECTION
# ============================================================

def get_connection(database=True):

    config = {
        "host": MYSQL_HOST,
        "user": MYSQL_USER,
        "password": MYSQL_PASSWORD
    }

    if database:
        config["database"] = MYSQL_DATABASE

    return mysql.connector.connect(**config)


# ============================================================
# CREATE DATABASE
# ============================================================

def create_database():

    connection = get_connection(database=False)
    cursor = connection.cursor()

    cursor.execute(
        f"CREATE DATABASE IF NOT EXISTS `{MYSQL_DATABASE}`"
    )

    connection.commit()
    cursor.close()
    connection.close()

    print("MySQL database ready.")


# ============================================================
# CREATE TABLES
# ============================================================

def create_tables():

    connection = get_connection()
    cursor = connection.cursor()

    # --------------------------------------------------------
    # STATIONS
    # --------------------------------------------------------

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS stations (

            station_id VARCHAR(30) PRIMARY KEY,

            station_code VARCHAR(30),

            station_name VARCHAR(255) NOT NULL,

            region VARCHAR(255),

            latitude DECIMAL(10,6),

            longitude DECIMAL(10,6),

            station_type VARCHAR(100)

        )
    """)

    # --------------------------------------------------------
    # TRACKS
    # --------------------------------------------------------

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS tracks (

            track_id VARCHAR(30) PRIMARY KEY,

            source_station_id VARCHAR(30) NOT NULL,

            source_station_name VARCHAR(255),

            destination_station_id VARCHAR(30) NOT NULL,

            destination_station_name VARCHAR(255),

            distance_km DECIMAL(10,2),

            speed_limit DECIMAL(10,2),

            capacity INT,

            electrified VARCHAR(20),

            track_type VARCHAR(50),

            status VARCHAR(50),

            FOREIGN KEY (source_station_id)
                REFERENCES stations(station_id),

            FOREIGN KEY (destination_station_id)
                REFERENCES stations(station_id)

        )
    """)

    # --------------------------------------------------------
    # TRAINS
    # --------------------------------------------------------

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS trains (

            train_id VARCHAR(30) PRIMARY KEY,

            train_number VARCHAR(30),

            train_name VARCHAR(255),

            train_type VARCHAR(100),

            priority INT,

            source_station_id VARCHAR(30),

            source_station_name VARCHAR(255),

            destination_station_id VARCHAR(30),

            destination_station_name VARCHAR(255),

            max_speed DECIMAL(10,2),

            length_m DECIMAL(10,2),

            FOREIGN KEY (source_station_id)
                REFERENCES stations(station_id),

            FOREIGN KEY (destination_station_id)
                REFERENCES stations(station_id)

        )
    """)

    # --------------------------------------------------------
    # SCHEDULES
    # --------------------------------------------------------

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS schedules (

            schedule_id VARCHAR(30) PRIMARY KEY,

            train_id VARCHAR(30) NOT NULL,

            station_id VARCHAR(30) NOT NULL,

            station_name VARCHAR(255),

            sequence_number INT,

            arrival_time VARCHAR(20),

            departure_time VARCHAR(20),

            platform VARCHAR(30),

            scheduled_day VARCHAR(50),

            FOREIGN KEY (train_id)
                REFERENCES trains(train_id),

            FOREIGN KEY (station_id)
                REFERENCES stations(station_id)

        )
    """)

    # --------------------------------------------------------
    # ROUTES
    # --------------------------------------------------------

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS train_routes (

            route_id VARCHAR(30),

            train_id VARCHAR(30) NOT NULL,

            track_id VARCHAR(30) NOT NULL,

            sequence_number INT,

            distance_km DECIMAL(10,2),

            expected_travel_time_min DECIMAL(10,2),

            PRIMARY KEY (
                train_id,
                track_id,
                sequence_number
            ),

            FOREIGN KEY (train_id)
                REFERENCES trains(train_id),

            FOREIGN KEY (track_id)
                REFERENCES tracks(track_id)

        )
    """)

    # --------------------------------------------------------
    # CONSTRUCTION BLOCKS
    # --------------------------------------------------------

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS construction_blocks (

            block_id INT AUTO_INCREMENT PRIMARY KEY,

            track_id VARCHAR(30) NOT NULL,

            start_time VARCHAR(20) NOT NULL,

            end_time VARCHAR(20) NOT NULL,

            reason VARCHAR(500),

            priority VARCHAR(30),

            status VARCHAR(30) DEFAULT 'PLANNED',

            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY (track_id)
                REFERENCES tracks(track_id)

        )
    """)

    # --------------------------------------------------------
    # TRAFFIC DECISIONS
    # --------------------------------------------------------

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS traffic_decisions (

            decision_id INT AUTO_INCREMENT PRIMARY KEY,

            train_id VARCHAR(30),

            train_number VARCHAR(30),

            block_id INT,

            decision VARCHAR(30),

            original_route TEXT,

            recommended_route TEXT,

            estimated_delay_minutes INT,

            reason TEXT,

            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY (train_id)
                REFERENCES trains(train_id),

            FOREIGN KEY (block_id)
                REFERENCES construction_blocks(block_id)

        )
    """)

    connection.commit()

    cursor.close()
    connection.close()

    print("All MySQL tables created.")


# ============================================================
# EXCEL HELPERS
# ============================================================

def clean(value):

    if pd.isna(value):
        return None

    return str(value).strip()


# ============================================================
# IMPORT EXCEL
# ============================================================

def import_excel():

    if not os.path.exists(EXCEL_FILE):

        print("ERROR: database.xlsx not found.")

        return

    print("Reading Excel database...")

    stations = pd.read_excel(
        EXCEL_FILE,
        sheet_name="staion",
        header=1
    )

    tracks = pd.read_excel(
        EXCEL_FILE,
        sheet_name="track",
        header=1
    )

    trains = pd.read_excel(
        EXCEL_FILE,
        sheet_name="trains",
        header=1
    )

    schedules = pd.read_excel(
        EXCEL_FILE,
        sheet_name="schedule",
        header=1
    )

    routes = pd.read_excel(
        EXCEL_FILE,
        sheet_name="route",
        header=1
    )

    connection = get_connection()
    cursor = connection.cursor()

    # ========================================================
    # STATIONS
    # ========================================================

    print("Importing stations...")

    for _, row in stations.iterrows():

        station_id = clean(row["Station ID"])

        if not station_id:
            continue

        station_code = clean(row["Station Code"])

        station_name = clean(row["Station"])

        region = clean(row["Region"])

        latitude = row["Latitude"]

        longitude = row["Longitude"]

        station_type = clean(row["Station type"])

        cursor.execute("""
            INSERT INTO stations
            (
                station_id,
                station_code,
                station_name,
                region,
                latitude,
                longitude,
                station_type
            )
            VALUES (%s,%s,%s,%s,%s,%s,%s)

            ON DUPLICATE KEY UPDATE

                station_code = VALUES(station_code),
                station_name = VALUES(station_name),
                region = VALUES(region),
                latitude = VALUES(latitude),
                longitude = VALUES(longitude),
                station_type = VALUES(station_type)
        """, (
            station_id,
            station_code,
            station_name,
            region,
            latitude,
            longitude,
            station_type
        ))

    # ========================================================
    # TRACKS
    # ========================================================

    print("Importing tracks...")

    for _, row in tracks.iterrows():

        track_id = clean(row["track_id"])

        if not track_id:
            continue

        cursor.execute("""
            INSERT INTO tracks
            (
                track_id,
                source_station_id,
                source_station_name,
                destination_station_id,
                destination_station_name,
                distance_km,
                speed_limit,
                capacity,
                electrified,
                track_type,
                status
            )
            VALUES
            (
                %s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s
            )

            ON DUPLICATE KEY UPDATE

                source_station_id =
                    VALUES(source_station_id),

                source_station_name =
                    VALUES(source_station_name),

                destination_station_id =
                    VALUES(destination_station_id),

                destination_station_name =
                    VALUES(destination_station_name),

                distance_km =
                    VALUES(distance_km),

                speed_limit =
                    VALUES(speed_limit),

                capacity =
                    VALUES(capacity),

                electrified =
                    VALUES(electrified),

                track_type =
                    VALUES(track_type),

                status =
                    VALUES(status)
        """, (

            track_id,

            clean(row["source_station_id"]),

            clean(row["source_station_name"]),

            clean(row["destination_station_id"]),

            clean(row["destination_station_name"]),

            row["distance_km"],

            row["speed_limit"],

            row["capacity"],

            clean(row["electrified"]),

            clean(row["track_type"]),

            clean(row["status"])
        ))

    # ========================================================
    # TRAINS
    # ========================================================

    print("Importing trains...")

    for _, row in trains.iterrows():

        train_id = clean(row["train_id"])

        if not train_id:
            continue

        cursor.execute("""
            INSERT INTO trains
            (
                train_id,
                train_number,
                train_name,
                train_type,
                priority,
                source_station_id,
                source_station_name,
                destination_station_id,
                destination_station_name,
                max_speed,
                length_m
            )
            VALUES
            (
                %s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s
            )

            ON DUPLICATE KEY UPDATE

                train_number =
                    VALUES(train_number),

                train_name =
                    VALUES(train_name),

                train_type =
                    VALUES(train_type),

                priority =
                    VALUES(priority),

                source_station_id =
                    VALUES(source_station_id),

                source_station_name =
                    VALUES(source_station_name),

                destination_station_id =
                    VALUES(destination_station_id),

                destination_station_name =
                    VALUES(destination_station_name),

                max_speed =
                    VALUES(max_speed),

                length_m =
                    VALUES(length_m)
        """, (

            train_id,

            clean(row["train_number"]),

            clean(row["train_name"]),

            clean(row["train_type"]),

            int(row["priority"]),

            clean(row["source_station_id"]),

            clean(row["source_station_name"]),

            clean(row["destination_station_id"]),

            clean(row["destination_station_name"]),

            row["max_speed"],

            row["length_m"]
        ))

    # ========================================================
    # SCHEDULES
    # ========================================================

    print("Importing schedules...")

    for _, row in schedules.iterrows():

        schedule_id = clean(row["schedule_id"])

        if not schedule_id:
            continue

        cursor.execute("""
            INSERT INTO schedules
            (
                schedule_id,
                train_id,
                station_id,
                station_name,
                sequence_number,
                arrival_time,
                departure_time,
                platform,
                scheduled_day
            )
            VALUES
            (
                %s,%s,%s,%s,%s,%s,%s,%s,%s
            )

            ON DUPLICATE KEY UPDATE

                train_id =
                    VALUES(train_id),

                station_id =
                    VALUES(station_id),

                station_name =
                    VALUES(station_name),

                sequence_number =
                    VALUES(sequence_number),

                arrival_time =
                    VALUES(arrival_time),

                departure_time =
                    VALUES(departure_time),

                platform =
                    VALUES(platform),

                scheduled_day =
                    VALUES(scheduled_day)
        """, (

            schedule_id,

            clean(row["train_id"]),

            clean(row["station_id"]),

            clean(row["station_name"]),

            int(row["sequence_number"]),

            clean(row["arrival_time"]),

            clean(row["departure_time"]),

            clean(row["platform"]),

            clean(row["scheduled_day"])
        ))

    # ========================================================
    # ROUTES
    # ========================================================

    print("Importing train routes...")

    for _, row in routes.iterrows():

        cursor.execute("""
            INSERT INTO train_routes
            (
                route_id,
                train_id,
                track_id,
                sequence_number,
                distance_km,
                expected_travel_time_min
            )
            VALUES
            (
                %s,%s,%s,%s,%s,%s
            )

            ON DUPLICATE KEY UPDATE

                route_id =
                    VALUES(route_id),

                distance_km =
                    VALUES(distance_km),

                expected_travel_time_min =
                    VALUES(expected_travel_time_min)
        """, (

            clean(row["route_id"]),

            clean(row["train_id"]),

            clean(row["track_id"]),

            int(row["sequence_number"]),

            row["distance_km"],

            row["expected_travel_time_min"]
        ))

    connection.commit()

    cursor.close()
    connection.close()

    print("Excel data imported successfully.")


# ============================================================
# TIME CONVERSION
# ============================================================

def time_to_minutes(value):

    if value is None:
        return None

    value = str(value).strip()

    if not value:
        return None

    if " " in value:

        value = value.split()[-1]

    value = value[:5]

    try:

        hour, minute = map(
            int,
            value.split(":")
        )

        return hour * 60 + minute

    except:

        return None


def time_overlap(
    train_start,
    train_end,
    block_start,
    block_end
):

    if None in (
        train_start,
        train_end,
        block_start,
        block_end
    ):

        return False

    return (
        train_start < block_end
        and
        train_end > block_start
    )


# ============================================================
# GET TRAIN ROUTE
# ============================================================

def get_train_route(train_id):

    connection = get_connection()
    cursor = connection.cursor(dictionary=True)

    cursor.execute("""
        SELECT

            r.track_id,

            r.sequence_number,

            t.source_station_id,

            t.destination_station_id,

            t.source_station_name,

            t.destination_station_name,

            t.distance_km,

            t.status

        FROM train_routes r

        JOIN tracks t
            ON r.track_id = t.track_id

        WHERE r.train_id = %s

        ORDER BY r.sequence_number
    """, (train_id,))

    rows = cursor.fetchall()

    cursor.close()
    connection.close()

    return rows


# ============================================================
# GET TRACK TIME FOR TRAIN
# ============================================================

def get_train_track_time(
    train_id,
    track_id
):

    connection = get_connection()
    cursor = connection.cursor(dictionary=True)

    cursor.execute("""
        SELECT *
        FROM tracks
        WHERE track_id = %s
    """, (track_id,))

    track = cursor.fetchone()

    if not track:

        cursor.close()
        connection.close()

        return None

    source = track["source_station_id"]

    destination = track[
        "destination_station_id"
    ]

    # --------------------------------------------------------
    # SOURCE STATION
    # --------------------------------------------------------

    cursor.execute("""
        SELECT *
        FROM schedules

        WHERE train_id = %s
        AND station_id = %s

        LIMIT 1
    """, (
        train_id,
        source
    ))

    source_schedule = cursor.fetchone()

    # --------------------------------------------------------
    # DESTINATION STATION
    # --------------------------------------------------------

    cursor.execute("""
        SELECT *
        FROM schedules

        WHERE train_id = %s
        AND station_id = %s

        LIMIT 1
    """, (
        train_id,
        destination
    ))

    destination_schedule = cursor.fetchone()

    cursor.close()
    connection.close()

    if not source_schedule or not destination_schedule:

        return None

    start = (
        source_schedule["departure_time"]
        or source_schedule["arrival_time"]
    )

    end = (
        destination_schedule["arrival_time"]
        or destination_schedule["departure_time"]
    )

    return {

        "start":
            time_to_minutes(start),

        "end":
            time_to_minutes(end),

        "start_display":
            start,

        "end_display":
            end
    }


# ============================================================
# CHECK WHETHER TRAIN USES BLOCKED TRACK
# ============================================================

def train_uses_track(
    train_id,
    track_id
):

    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        SELECT COUNT(*)

        FROM train_routes

        WHERE train_id = %s
        AND track_id = %s
    """, (
        train_id,
        track_id
    ))

    count = cursor.fetchone()[0]

    cursor.close()
    connection.close()

    return count > 0


# ============================================================
# FIND ALTERNATIVE ROUTE
# ============================================================

def find_alternative_route(
    source,
    destination,
    blocked_track
):

    connection = get_connection()
    cursor = connection.cursor(dictionary=True)

    cursor.execute("""
        SELECT *

        FROM tracks

        WHERE status = 'Available'

        AND track_id != %s
    """, (blocked_track,))

    tracks = cursor.fetchall()

    cursor.close()
    connection.close()

    # --------------------------------------------------------
    # CREATE GRAPH
    # --------------------------------------------------------

    graph = {}

    for track in tracks:

        start = track[
            "source_station_id"
        ]

        end = track[
            "destination_station_id"
        ]

        distance = float(
            track["distance_km"] or 0
        )

        graph.setdefault(
            start,
            []
        ).append(
            (
                end,
                distance,
                track["track_id"]
            )
        )

    # --------------------------------------------------------
    # DIJKSTRA
    # --------------------------------------------------------

    queue = [
        (0, source, [])
    ]

    visited = set()

    while queue:

        distance, current, path = (
            heapq.heappop(queue)
        )

        if current in visited:
            continue

        visited.add(current)

        if current == destination:

            return {

                "distance":
                    round(distance, 2),

                "tracks":
                    path

            }

        for (
            next_station,
            edge_distance,
            track_id
        ) in graph.get(current, []):

            if next_station in visited:
                continue

            heapq.heappush(
                queue,
                (
                    distance + edge_distance,
                    next_station,
                    path + [track_id]
                )
            )

    return None


# ============================================================
# ANALYZE TRAIN
# ============================================================

def analyze_train(
    train,
    block
):

    train_id = train["train_id"]

    blocked_track = block["track_id"]

    block_start = time_to_minutes(
        block["start_time"]
    )

    block_end = time_to_minutes(
        block["end_time"]
    )

    # --------------------------------------------------------
    # 1. TRAIN DOES NOT USE TRACK
    # --------------------------------------------------------

    if not train_uses_track(
        train_id,
        blocked_track
    ):

        return {

            "decision": "NORMAL",

            "delay": 0,

            "reason":
                "Train does not use the blocked track.",

            "route":
                "Original Route"
        }

    # --------------------------------------------------------
    # 2. CHECK TIMING
    # --------------------------------------------------------

    track_time = get_train_track_time(
        train_id,
        blocked_track
    )

    if track_time:

        if not time_overlap(

            track_time["start"],

            track_time["end"],

            block_start,

            block_end

        ):

            return {

                "decision":
                    "NORMAL",

                "delay":
                    0,

                "reason":
                    "Train uses the track but is not "
                    "scheduled during the construction block.",

                "route":
                    "Original Route"
            }

    # --------------------------------------------------------
    # 3. FIND ALTERNATIVE
    # --------------------------------------------------------

    alternative = find_alternative_route(

        train["source_station_id"],

        train["destination_station_id"],

        blocked_track
    )

    if alternative:

        original_route = get_train_route(
            train_id
        )

        original_distance = sum(

            float(
                track["distance_km"] or 0
            )

            for track in original_route
        )

        extra_distance = max(

            0,

            alternative["distance"]
            - original_distance
        )

        estimated_delay = int(
            extra_distance / 1.2
        )

        return {

            "decision":
                "DIVERT",

            "delay":
                estimated_delay,

            "reason":
                "Construction affects the train and "
                "an alternative route is available.",

            "route":
                " → ".join(
                    alternative["tracks"]
                ),

            "alternative_tracks":
                alternative["tracks"],

            "additional_distance_km":
                round(
                    extra_distance,
                    2
                )
        }

    # --------------------------------------------------------
    # 4. RESCHEDULE
    # --------------------------------------------------------

    if train["priority"] <= 2:

        return {

            "decision":
                "RESCHEDULE",

            "delay":
                max(
                    30,
                    block_end - block_start
                ),

            "reason":
                "No feasible diversion route was found. "
                "Train should be rescheduled.",

            "route":
                "Original Route"
        }

    # --------------------------------------------------------
    # 5. HOLD — LAST OPTION
    # --------------------------------------------------------

    return {

        "decision":
            "HOLD",

        "delay":
            max(
                30,
                block_end - block_start
            ),

        "reason":
            "No diversion route is available and "
            "rescheduling is not preferred. "
            "Temporary holding is the last option.",

        "route":
            "Original Route"
    }


# ============================================================
# HOME
# ============================================================

@app.route("/")
def home():

    return jsonify({

        "system":
            "AI Railway Construction Traffic Management System",

        "status":
            "ONLINE",

        "database":
            "MySQL",

        "message":
            "Railway backend is running successfully."
    })


# ============================================================
# DATABASE STATUS
# ============================================================

@app.route("/api/database")
def database_status():

    connection = get_connection()
    cursor = connection.cursor()

    tables = [
        "stations",
        "tracks",
        "trains",
        "schedules",
        "train_routes",
        "construction_blocks",
        "traffic_decisions"
    ]

    result = {}

    for table in tables:

        cursor.execute(
            f"SELECT COUNT(*) FROM {table}"
        )

        result[table] = cursor.fetchone()[0]

    cursor.close()
    connection.close()

    return jsonify(result)


# ============================================================
# STATIONS
# ============================================================

@app.route("/api/stations")
def stations():

    connection = get_connection()
    cursor = connection.cursor(dictionary=True)

    cursor.execute("""
        SELECT *
        FROM stations
        ORDER BY station_id
    """)

    data = cursor.fetchall()

    cursor.close()
    connection.close()

    return jsonify(data)


# ============================================================
# TRACKS
# ============================================================

@app.route("/api/tracks")
def tracks():

    connection = get_connection()
    cursor = connection.cursor(dictionary=True)

    cursor.execute("""
        SELECT *
        FROM tracks
        ORDER BY track_id
    """)

    data = cursor.fetchall()

    cursor.close()
    connection.close()

    return jsonify(data)


# ============================================================
# TRAINS
# ============================================================

@app.route("/api/trains")
def trains():

    connection = get_connection()
    cursor = connection.cursor(dictionary=True)

    cursor.execute("""
        SELECT *
        FROM trains
        ORDER BY train_number
    """)

    data = cursor.fetchall()

    cursor.close()
    connection.close()

    return jsonify(data)


# ============================================================
# SCHEDULES
# ============================================================

@app.route("/api/schedules")
def schedules():

    connection = get_connection()
    cursor = connection.cursor(dictionary=True)

    cursor.execute("""
        SELECT *
        FROM schedules

        ORDER BY
            train_id,
            sequence_number
    """)

    data = cursor.fetchall()

    cursor.close()
    connection.close()

    return jsonify(data)


# ============================================================
# CONSTRUCTION BLOCK
# ============================================================

@app.route(
    "/api/construction",
    methods=["GET", "POST"]
)
def construction():

    connection = get_connection()
    cursor = connection.cursor(dictionary=True)

    # --------------------------------------------------------
    # CREATE BLOCK
    # --------------------------------------------------------

    if request.method == "POST":

        data = request.get_json()

        track_id = data.get("track_id")

        start_time = data.get(
            "start_time"
        )

        end_time = data.get(
            "end_time"
        )

        reason = data.get(
            "reason",
            "Railway construction work"
        )

        priority = data.get(
            "priority",
            "HIGH"
        )

        if not track_id:

            cursor.close()
            connection.close()

            return jsonify({
                "error":
                    "track_id is required."
            }), 400

        cursor.execute("""
            INSERT INTO construction_blocks
            (
                track_id,
                start_time,
                end_time,
                reason,
                priority
            )

            VALUES
            (
                %s,%s,%s,%s,%s
            )
        """, (
            track_id,
            start_time,
            end_time,
            reason,
            priority
        ))

        connection.commit()

        block_id = cursor.lastrowid

        cursor.close()
        connection.close()

        return jsonify({

            "message":
                "Construction block created.",

            "block_id":
                block_id
        })

    # --------------------------------------------------------
    # GET BLOCKS
    # --------------------------------------------------------

    cursor.execute("""
        SELECT *
        FROM construction_blocks

        ORDER BY block_id DESC
    """)

    data = cursor.fetchall()

    cursor.close()
    connection.close()

    return jsonify(data)


# ============================================================
# ANALYZE TRAFFIC
# ============================================================

@app.route(
    "/api/analyze",
    methods=["GET", "POST"]
)
def analyze():

    connection = get_connection()
    cursor = connection.cursor(dictionary=True)

    # --------------------------------------------------------
    # POST = NEW BLOCK
    # --------------------------------------------------------

    if request.method == "POST":

        data = request.get_json()

        track_id = data.get(
            "track_id"
        )

        start_time = data.get(
            "start_time"
        )

        end_time = data.get(
            "end_time"
        )

        if not track_id:

            cursor.close()
            connection.close()

            return jsonify({
                "error":
                    "track_id is required."
            }), 400

        block = {

            "block_id":
                None,

            "track_id":
                track_id,

            "start_time":
                start_time,

            "end_time":
                end_time
        }

    # --------------------------------------------------------
    # GET = LAST SAVED BLOCK
    # --------------------------------------------------------

    else:

        cursor.execute("""
            SELECT *

            FROM construction_blocks

            ORDER BY block_id DESC

            LIMIT 1
        """)

        block = cursor.fetchone()

        if not block:

            cursor.close()
            connection.close()

            return jsonify({

                "error":
                    "No construction block found."
            }), 404

    # --------------------------------------------------------
    # GET TRAINS
    # --------------------------------------------------------

    cursor.execute("""
        SELECT *

        FROM trains

        ORDER BY priority, train_number
    """)

    train_rows = cursor.fetchall()

    cursor.close()
    connection.close()

    # --------------------------------------------------------
    # ANALYZE
    # --------------------------------------------------------

    decisions = []

    for train in train_rows:

        result = analyze_train(
            train,
            block
        )

        decisions.append({

            "train_id":
                train["train_id"],

            "train_number":
                train["train_number"],

            "train_name":
                train["train_name"],

            "train_type":
                train["train_type"],

            "priority":
                train["priority"],

            "source":
                train["source_station_name"],

            "destination":
                train["destination_station_name"],

            "decision":
                result["decision"],

            "estimated_delay_minutes":
                result["delay"],

            "reason":
                result["reason"],

            "recommended_route":
                result["route"],

            "additional_distance_km":
                result.get(
                    "additional_distance_km",
                    0
                )
        })

    # --------------------------------------------------------
    # SUMMARY
    # --------------------------------------------------------

    summary = {

        "total_trains":
            len(decisions),

        "normal":
            sum(
                d["decision"] == "NORMAL"
                for d in decisions
            ),

        "diverted":
            sum(
                d["decision"] == "DIVERT"
                for d in decisions
            ),

        "rescheduled":
            sum(
                d["decision"] == "RESCHEDULE"
                for d in decisions
            ),

        "held":
            sum(
                d["decision"] == "HOLD"
                for d in decisions
            )
    }

    return jsonify({

        "construction_block":
            block,

        "summary":
            summary,

        "decisions":
            decisions
    })


# ============================================================
# SAVE DECISION
# ============================================================

@app.route(
    "/api/decisions",
    methods=["GET", "POST"]
)
def decisions():

    connection = get_connection()
    cursor = connection.cursor(dictionary=True)

    # --------------------------------------------------------
    # SAVE
    # --------------------------------------------------------

    if request.method == "POST":

        data = request.get_json()

        cursor.execute("""
            INSERT INTO traffic_decisions
            (
                train_id,
                train_number,
                block_id,
                decision,
                original_route,
                recommended_route,
                estimated_delay_minutes,
                reason
            )

            VALUES
            (
                %s,%s,%s,%s,%s,%s,%s,%s
            )
        """, (

            data.get("train_id"),

            data.get("train_number"),

            data.get("block_id"),

            data.get("decision"),

            data.get("original_route"),

            data.get("recommended_route"),

            data.get(
                "estimated_delay_minutes"
            ),

            data.get("reason")
        ))

        connection.commit()

        decision_id = cursor.lastrowid

        cursor.close()
        connection.close()

        return jsonify({

            "message":
                "Decision saved.",

            "decision_id":
                decision_id
        })

    # --------------------------------------------------------
    # GET HISTORY
    # --------------------------------------------------------

    cursor.execute("""
        SELECT *

        FROM traffic_decisions

        ORDER BY decision_id DESC
    """)

    data = cursor.fetchall()

    cursor.close()
    connection.close()

    return jsonify(data)


# ============================================================
# START APPLICATION
# ============================================================

if __name__ == "__main__":

    print()
    print("==============================================")
    print("RAILWAY TRAFFIC MANAGEMENT SYSTEM")
    print("==============================================")

    try:

        create_database()

        create_tables()

        import_excel()

        print()
        print("==============================================")
        print("BACKEND READY")
        print("==============================================")
        print("URL: http://127.0.0.1:5000")
        print("Database: MySQL")
        print("==============================================")
        print()

        app.run(
            host="127.0.0.1",
            port=5000,
            debug=True
        )

    except Error as e:

        print()
        print("MYSQL ERROR:")
        print(e)

        print()
        print(
            "Check that MySQL Server is running "
            "and your username/password are correct."
        )

    except Exception as e:

        print()
        print("APPLICATION ERROR:")
        print(e)