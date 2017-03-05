from irobot.robots.create2 import Create2
from irobot.openinterface.constants import MODES
import time
import serial
from socketIO_client import SocketIO, LoggingNamespace, BaseNamespace
import sys
import math
import copy

def connect_robot():
	port = 'COM3'
	# instantiate robot
	robot = Create2(port)
	robot.start()
	# change mode to drive (SAFE|FULL)
	robot.oi_mode = MODES.FULL

	print('Robot connected and ready for commands')
	return robot

# my_robot = connect_robot()
my_data = (0,0)

def align_to_wall(robot):
	# Find wall
	done = 0
	while not done:
		if robot.light_bump_center_right_signal > 150:
			robot.drive_straight(0)
			done = 1
		robot.drive_straight(150)

	# Turn left so that the wall is to the right
	t = time.time() + 2.5
	while time.time() < t:
		robot.spin_left(50)

def distance (point1, point2):
	dx = point1[0] - point2[0]
	dy = point1[1] - point2[1]

	return math.sqrt(dx ** 2 + dy ** 2)

# Get coordinate position of robot based on wheel velocities.
def get_position_change(robot, t, phi):
	right_velo = robot.requested_right_velocity
	left_velo = robot.requested_left_velocity
	phi += robot.angle # Update direction

	v2 = max(right_velo, left_velo)
	v1 = min(right_velo, left_velo)
	v = (right_velo + left_velo) / 2. # Average velocity

	d = 235. # Distannce between wheels, in mm

	r = (d / v2) / (1. / v2 + 1. / v1) + d / 2. # Movement radius of center

	w = r / v # Angular velocity

	if right_velo < left_velo: # negative direction for turning right
		w *= -1

	# Get change in coordinate positions. 
	# Phi is angle of current direction.
	dx = math.sin(w*t + phi)
	dy = math.cos(w*t + phi)

	return dx, dy

def follow_right_wall(robot):

	wall_coordinates = []

	done = 0
	t_init = time.time()
	t = time.time()
	phi, x, y = 0
	while not done:

		# If we are back at the origin, stop mapping.
		if time.time() - t_init > 30 and distance((x, y), (0,0)) < 300:
			# stop driving
			robot.drive_straight(0)
			# Print done on LED display
			robot.set_ascii_leds(68, 79, 78, 69)
			done = 1

		# If too close to wall on right
		elif robot.light_bump_right_signal > 50:
			robot.spin_left(50)

		# If no wall on right, turn right
		elif robot.light_bump_right_signal < 20:
			robot.spin_right(50)

		# If there is a corner to the front and right we wish to avoid,
		# gradually go around it
		elif robot.light_bump_front_right_signal > 70:
			robot.drive(35, 50)

		# If a wall is not in front of the robot, go forward
		elif robot.light_bump_center_right_signal < 150:
			robot.drive_straight(150) 

		# Edge cases, just force big left turn
		else:
			t = time.time() + 2.5
			while time.time() < t:
				robot.spin_left(50)

		# update position
		t = time.time() - t
		t /= 2.
		dx, dy = get_position_change(robot, t, phi)
		x += dx
		y += dy
		wall_coordinates.append((x, y))

	# Limit size of list of wall coordinates
	for i, pt in wall_coordinates[:len(wall_coordinates)]:
		if distance(pt, wall_coordinates[i + 1]) <= 10: # If subsequent points are within 1cm, remove
			wall_coordinates.remove(pt)

	for element in wall_coordinates:
            update_list(element)
            fill_in_wall()
	data = open("WallData.txt", 'w')
	for element in filled_walls:
            data.write(element[0] + ", " + element[1])
        data.close()

def follow_path(robot, path):
	velocity = 50 #mm/s

	# Odd elements are y displacement, even, x
	for i, movement in enumerate(path):

		if i % 2 == 0: # odd element
			add_time = abs(float(movement)) / float(velocity)
			t = time.time() + add_time
			while time.time() < t:
				v = velocity
				if movement < 0:
					v = velocity * -1
				robot.drive_straight(v)

			# Turn 90 degrees cw 
			t1 = time.time() + 3
			while time.time() <  t1:
				robot.spin_right(50)

		else:
			add_time = abs(float(movement)) / float(velocity)
			t = time.time() + add_time
			while time.time() < t:
				v = velocity
				if movement < 0:
					v = velocity * -1
				robot.drive_straight(v)


walls = []
filled_walls = []
path_list = []
nodes = {}

def fill_in_wall():
    global walls
    global filled_walls
    for i in walls:
        if i not in filled_walls:
            filled_walls.append(i)
    temp_point = walls[0]
    for i, element in enumerate(walls):
        while True:
            tempPoint = element
            if(tempPoint[0] > temp_point[0] + 1):
                pt = (tempPoint - 1, element[1])
                tempPoint[0] -= 1;
                walls.insert(i + 1, pt)
            else:
                break
        while True:
            tempPoint = element
            if(tempPoint[0] < temp_point[0] - 1):
                pt = (tempPoint + 1, element[1])
                tempPoint[0] += 1;
                walls.insert(i + 1, pt)
            else:
                break
        while True:
            tempPoint = element
            if(tempPoint[1] > temp_point[1] + 1):
                pt = (element[0], tempPoint - 1)
                tempPoint[1] -= 1;
                walls.insert(i + 1, pt)
            else:
                break
        while True:
            tempPoint = element
            if(tempPoint[1] < temp_point[1] - 1):
                pt = (element[0], tempPoint + 1)
                tempPoint[1] += 1;
                walls.insert(i + 1, pt)
            else:
                break
        temp_point = elemnet


def make_nodes(start):
    global nodes
    global filled_walls
    nodes[start] = (math.inf, 0, 0, 0)
    if not (start[0] - 1, start[1]) in filled_walls:
        make_nodes((start[0] - 1, start[1]))
    if not (start[0] + 1, start[1]) in filled_walls:
        make_nodes((start[0] + 1, start[1]))
    if not (start[0], start[1] - 1) in filled_walls:
        make_nodes((start[0], start[1] - 1))
    if not (start[0], start[1] + 1) in filled_walls:
        make_nodes((start[0], start[1] + 1))
        

def update_list(pt):
    global walls
    if pt not in walls:
        walls.append(pt)
        

def compute_path(goal, position):
    global nodes
    test = (position[0] + 1, position[1])
    if(test in nodes):
        if(nodes[test[1]] == 0):
            if(nodes[test][0] < nodes[position][0]):
                nodes[test] = (nodes[test[0]], 0, position[0], position[1])
    test = (position[0] - 1, position[1])
    if(test in nodes):
        if(nodes[test[1]] == 0):
            if(nodes[test][0] < nodes[position][0]):
                nodes[test] = (nodes[test[0]], 0, position[0], position[1])
    test = (position[0], position[1] + 1)
    if(test in nodes):
        if(nodes[test[1]] == 0):
            if(nodes[test][0] < nodes[position][0]):
                nodes[test] = (nodes[test[0]], 0, position[0], position[1])
    test = (position[0], position[1] - 1)
    if(test in nodes):
        if(nodes[test[1]] == 0):
            if(nodes[test][0] < nodes[position][0]):
                nodes[test] = (nodes[test[0]], 0, position[0], position[1])
    nodes[position][1] = 1
    if position != goal:
        value = math.inf
        for k, v in nodes:
            if v[0] <= value:
                value = v[0]
                storekey = k
        compute_path(goal, storekey)

def load_walls():
    data = open("WallData.txt", "r")

    for line in data:
        line = line.strip().split(',')
        x = int(line[0])
        y = int(line[1])

        update_list((x, y))

    data.close()

    filled_walls = copy.deepcopy(walls) 

def setup_nodes(): 
    make_nodes((0, 1))
    nodes[(0, 1)] = (0, 0, 0, 0)

def create_path(robot):
    countx = 0
    county = 0
    position = sys.argv[1]
    while True:
        x = position[0] - nodes[position[3]]
        y = position[1] - nodes[position[4]]
        if x != 0:
            last = 'x'
            if countx == 0:
                path_list.insert(0, county)
                countx = x
                county = 0
            else:
                countx += x
        if county != 0:
            last = 'y'
            if county == 0:
                path_list.insert(0, countx)
                county = y
                countx = 0
            else:
                county += y
        position = (nodes[position[3]], nodes[position[4]])
        if position == (0, 1):
            break
    if last == 'y':
        path_list[0] += 1
    else:
        path_list.insert(0, 1)

    follow_path(robot, path_list)

BUSY = False
READY = True
        
hostname = '192.168.1.5'

filled_walls = [(3, 4), (3, 5), (4, 5), (5, 5), (5, 4), (4, 4), (3, 4)]

class ControlNamespace(BaseNamespace):
    def on_connect(self):
        print 'connected to server at ' + hostname

    def on_disconnect(self):
        print 'disconnected from server at ' + hostname

    def on_reconnect(self):
        print 'reconnected to server at ' + hostname

    def message_ui(self, msg):
        self.emit('message', msg)
    
    def on_message(self, *args):
        if len(args) == 1:
            print 'SERVER:'
            print args[0]
            self.emit('message', 'receieved message')
            if args[0]['command'] == "make map":
                self.emit('status', BUSY)
                self.emit('message', 'starting map creation\naligning self to wall')
                # align_to_wall(my_robot)
                self.emit('message', 'robot aligned to wall\nrobot following wall')
                # follow_right_wall(my_robot)
                self.emit('message', 'finished making map')
                control_namespace.emit('data', filled_walls)
                self.emit('status', READY)
            if args[0]['command'] == "call robot":
                self.emit('status', BUSY)
                print str(args[0]['goal_x']) + ', ' + str(args[0]['goal_y'])
                self.emit('message', 'loading in room boundaries')
                # load_walls()
                self.emit('message', 'walls loaded successfully\nsetting up nodes')
                # setup_nodes()
                self.emit('message', 'nodes created\ncomputing robot path')
                # compute_path((goal_x, goal_y), (0, 1))
                self.emit('message', 'path computed successfully\nloading path')
                # create_path(my_robot)
                self.emit('message', 'robot is on its way')
                self.emit('status', READY)
        print
                
socketIO = SocketIO(hostname, 3000)
control_namespace = socketIO.define(ControlNamespace, '/control')
socketIO.wait()
