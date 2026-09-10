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

    # --------------------------------------------------------
    # VIRTUAL SENSOR NODES (VSN - Software Telemetry)
    # --------------------------------------------------------

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS virtual_sensor_nodes (

            vsn_id VARCHAR(30) PRIMARY KEY,

            track_id VARCHAR(30) NOT NULL,

            latitude DECIMAL(10,6),

            longitude DECIMAL(10,6),

            km_position DECIMAL(10,2),

            train_speed DECIMAL(10,2) DEFAULT 80.0,

            track_occupancy INT DEFAULT 0,

            track_condition VARCHAR(50) DEFAULT 'GOOD',

            vibration_level VARCHAR(50) DEFAULT 'NORMAL',

            signal_status VARCHAR(20) DEFAULT 'GREEN',

            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

            anomaly_score DECIMAL(5,2) DEFAULT 8.0,

            blockage_probability DECIMAL(5,2) DEFAULT 8.0,

            status VARCHAR(50) DEFAULT 'NORMAL',

            FOREIGN KEY (track_id)
                REFERENCES tracks(track_id)

        )
    """)

    connection.commit()

    cursor.close()
    connection.close()

    print("All MySQL tables created including Virtual Sensor Network (VSN).")


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
# VIRTUAL SENSOR NETWORK (VSN) – AI ANOMALY DETECTION ENGINE
# ============================================================

DEFAULT_VSN_DATA = [
    {
        "vsn_id": "VSN-024",
        "track_id": "TRK009",
        "latitude": 28.4595,
        "longitude": 77.0266,
        "km_position": 18.5,
        "train_speed": 80.0,
        "track_occupancy": 0,
        "track_condition": "GOOD",
        "vibration_level": "NORMAL",
        "signal_status": "GREEN",
        "anomaly_score": 8.0,
        "blockage_probability": 8.0,
        "status": "NORMAL"
    },
    {
        "vsn_id": "VSN-001",
        "track_id": "TRK001",
        "latitude": 28.6142,
        "longitude": 77.1585,
        "km_position": 12.0,
        "train_speed": 85.0,
        "track_occupancy": 0,
        "track_condition": "GOOD",
        "vibration_level": "NORMAL",
        "signal_status": "GREEN",
        "anomaly_score": 6.0,
        "blockage_probability": 6.0,
        "status": "NORMAL"
    },
    {
        "vsn_id": "VSN-005",
        "track_id": "TRK005",
        "latitude": 28.5882,
        "longitude": 77.2534,
        "km_position": 8.2,
        "train_speed": 75.0,
        "track_occupancy": 0,
        "track_condition": "GOOD",
        "vibration_level": "NORMAL",
        "signal_status": "GREEN",
        "anomaly_score": 9.0,
        "blockage_probability": 9.0,
        "status": "NORMAL"
    },
    {
        "vsn_id": "VSN-014",
        "track_id": "TRK014",
        "latitude": 28.6653,
        "longitude": 77.3120,
        "km_position": 22.4,
        "train_speed": 70.0,
        "track_occupancy": 0,
        "track_condition": "GOOD",
        "vibration_level": "NORMAL",
        "signal_status": "GREEN",
        "anomaly_score": 7.0,
        "blockage_probability": 7.0,
        "status": "NORMAL"
    }
]

# In-memory store fallback for demo when MySQL is not initialized
vsn_memory_store = {item["vsn_id"]: dict(item) for item in DEFAULT_VSN_DATA}


def compute_vsn_anomaly(vsn):
    """
    Transparent, explainable multi-factor AI anomaly detection engine.
    Calculates anomaly_score, blockage_probability, and human-readable reasoning.
    """
    speed = float(vsn.get("train_speed", 80))
    occupancy = int(vsn.get("track_occupancy", 0))
    condition = str(vsn.get("track_condition", "GOOD")).upper()
    vibration = str(vsn.get("vibration_level", "NORMAL")).upper()
    signal = str(vsn.get("signal_status", "GREEN")).upper()

    score = 0.0
    reasons = []

    # Factor 1: Train speed anomaly (weight 25%)
    if speed == 0 and occupancy == 1:
        score += 25.0
        reasons.append("Prolonged zero train speed (0 km/h) with active track occupancy")
    elif speed < 30 and speed > 0:
        score += 12.0
        reasons.append("Severe speed restriction / creeping movement under 30 km/h")

    # Factor 2: Track occupancy mismatch (weight 20%)
    if occupancy == 1:
        score += 15.0
        reasons.append("Track section occupied / block segment continuous presence")

    # Factor 3: Track physical condition (weight 25%)
    if condition == "CRITICAL":
        score += 25.0
        reasons.append("Critical track structural defect / geometry deviation detected")
    elif condition == "WARNING":
        score += 12.0
        reasons.append("Track condition degraded to warning threshold")

    # Factor 4: Dynamic rail vibration (weight 15%)
    if vibration in ["HIGH", "SEVERE"]:
        score += 15.0
        reasons.append("Abnormal high rail oscillation & acoustic vibration")
    elif vibration == "ELEVATED":
        score += 8.0
        reasons.append("Elevated sleeper/ballast vibration levels")

    # Factor 5: Interlocking signal restriction (weight 15%)
    if signal == "RED":
        score += 15.0
        reasons.append("Red interlocking signal aspect active / route locked")
    elif signal in ["YELLOW", "CAUTION"]:
        score += 7.0
        reasons.append("Cautionary yellow signal aspect")

    # Calibration & probability calculation
    anomaly_score = round(min(100.0, max(5.0, score)), 1)
    blockage_prob = round(min(99.0, max(5.0, anomaly_score * 1.04)), 1)

    # Classify status based on transparent thresholds
    if blockage_prob >= 85.0:
        status = "BLOCKED"
        assessment = "HIGH PROBABILITY OF BLOCKAGE"
    elif blockage_prob >= 70.0:
        status = "HIGH RISK"
        assessment = "ELEVATED RISK OF BLOCKAGE"
    elif blockage_prob >= 40.0:
        status = "CAUTION"
        assessment = "MODERATE RISK - CAUTION ADVISED"
    else:
        status = "NORMAL"
        assessment = "NORMAL SAFE OPERATIONS"
        if not reasons:
            reasons.append("All structural and operational parameters within normal limits")

    return {
        "anomaly_score": anomaly_score,
        "blockage_probability": blockage_prob,
        "status": status,
        "ai_assessment": assessment,
        "reasons": reasons
    }


@app.route("/api/vsn", methods=["GET"])
def get_all_vsn():
    """Returns all Virtual Sensor Nodes with live telemetry & AI assessment."""
    try:
        connection = get_connection()
        cursor = connection.cursor(dictionary=True)
        cursor.execute("SELECT * FROM virtual_sensor_nodes ORDER BY vsn_id ASC")
        rows = cursor.fetchall()
        cursor.close()
        connection.close()

        if rows:
            for row in rows:
                analysis = compute_vsn_anomaly(row)
                row["ai_assessment"] = analysis["ai_assessment"]
                row["reasons"] = analysis["reasons"]
            return jsonify(rows)
    except Exception:
        pass

    # Fallback in-memory
    result = []
    for item in vsn_memory_store.values():
        analysis = compute_vsn_anomaly(item)
        full_item = dict(item)
        full_item.update(analysis)
        result.append(full_item)
    return jsonify(result)


@app.route("/api/vsn/<vsn_id>", methods=["GET"])
def get_vsn_by_id(vsn_id):
    """Returns a specific Virtual Sensor Node."""
    vsn_id = vsn_id.upper()
    try:
        connection = get_connection()
        cursor = connection.cursor(dictionary=True)
        cursor.execute("SELECT * FROM virtual_sensor_nodes WHERE vsn_id = %s", (vsn_id,))
        row = cursor.fetchone()
        cursor.close()
        connection.close()
        if row:
            analysis = compute_vsn_anomaly(row)
            row.update(analysis)
            return jsonify(row)
    except Exception:
        pass

    item = vsn_memory_store.get(vsn_id)
    if item:
        analysis = compute_vsn_anomaly(item)
        full_item = dict(item)
        full_item.update(analysis)
        return jsonify(full_item)

    return jsonify({"error": f"VSN {vsn_id} not found"}), 404


@app.route("/api/vsn/simulate-fault", methods=["POST"])
def simulate_vsn_fault():
    """
    Simulates abnormal/critical readings for a VSN (e.g. VSN-024) for hackathon demo.
    """
    data = request.get_json() or {}
    vsn_id = data.get("vsn_id", "VSN-024").upper()
    severity = data.get("severity", "CRITICAL").upper()

    fault_readings = {
        "train_speed": 0.0,
        "track_occupancy": 1,
        "track_condition": "CRITICAL" if severity == "CRITICAL" else "WARNING",
        "vibration_level": "HIGH",
        "signal_status": "RED" if severity == "CRITICAL" else "YELLOW"
    }

    analysis = compute_vsn_anomaly(fault_readings)
    fault_readings.update(analysis)

    # Update in memory
    if vsn_id in vsn_memory_store:
        vsn_memory_store[vsn_id].update(fault_readings)

    # Update in MySQL if active
    try:
        connection = get_connection()
        cursor = connection.cursor()
        cursor.execute("""
            UPDATE virtual_sensor_nodes
            SET train_speed = %s, track_occupancy = %s, track_condition = %s,
                vibration_level = %s, signal_status = %s, anomaly_score = %s,
                blockage_probability = %s, status = %s
            WHERE vsn_id = %s
        """, (
            fault_readings["train_speed"],
            fault_readings["track_occupancy"],
            fault_readings["track_condition"],
            fault_readings["vibration_level"],
            fault_readings["signal_status"],
            fault_readings["anomaly_score"],
            fault_readings["blockage_probability"],
            fault_readings["status"],
            vsn_id
        ))
        connection.commit()
        cursor.close()
        connection.close()
    except Exception:
        pass

    return jsonify({
        "message": f"Simulated fault injected into {vsn_id}.",
        "vsn_id": vsn_id,
        "telemetry": fault_readings,
        "notice": "Virtual Sensor Network — Simulated Prototype Data"
    })


@app.route("/api/vsn/reset", methods=["POST"])
def reset_vsn_simulation():
    """Resets all VSNs to normal healthy baseline values."""
    global vsn_memory_store
    vsn_memory_store = {item["vsn_id"]: dict(item) for item in DEFAULT_VSN_DATA}

    try:
        connection = get_connection()
        cursor = connection.cursor()
        for item in DEFAULT_VSN_DATA:
            cursor.execute("""
                UPDATE virtual_sensor_nodes
                SET train_speed = %s, track_occupancy = %s, track_condition = %s,
                    vibration_level = %s, signal_status = %s, anomaly_score = %s,
                    blockage_probability = %s, status = %s
                WHERE vsn_id = %s
            """, (
                item["train_speed"],
                item["track_occupancy"],
                item["track_condition"],
                item["vibration_level"],
                item["signal_status"],
                item["anomaly_score"],
                item["blockage_probability"],
                item["status"],
                item["vsn_id"]
            ))
        connection.commit()
        cursor.close()
        connection.close()
    except Exception:
        pass

    return jsonify({
        "message": "All Virtual Sensor Nodes restored to normal baseline.",
        "status": "NORMAL",
        "notice": "Virtual Sensor Network — Simulated Prototype Data"
    })


@app.route("/api/vsn/<vsn_id>/analysis", methods=["GET"])
def get_vsn_analysis(vsn_id):
    """Returns detailed explainable AI anomaly analysis for a VSN."""
    vsn_id = vsn_id.upper()
    item = vsn_memory_store.get(vsn_id, DEFAULT_VSN_DATA[0])
    analysis = compute_vsn_anomaly(item)
    return jsonify({
        "vsn_id": vsn_id,
        "track_id": item.get("track_id"),
        "km_position": item.get("km_position"),
        "telemetry": {
            "train_speed": item.get("train_speed"),
            "track_occupancy": item.get("track_occupancy"),
            "track_condition": item.get("track_condition"),
            "vibration_level": item.get("vibration_level"),
            "signal_status": item.get("signal_status")
        },
        "ai_detection": analysis,
        "architecture_note": "Software-defined Virtual Sensor Network prototype. Can be fed by physical SCADA/IoT sensors in production."
    })


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