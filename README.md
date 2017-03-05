# pibot2
Our program creates an interface for robotic delivery in a building.

Using Google App a building complex or company can set up a website with
accounts for the people in the building.  This website will communicate with a
fleet of robots.  In particular a fleet of Roomba Create 2's - each connected to
a Raspberry Pi and using these to interface with the server and back-end AI -
are used. Each Roomba can be connected to its Raspberry Pi via serial-USB cable.
The plan calls for each Roomba to connect to the website via wifi connectivity
on the Raspberry Pi. This, of course, was not available in our given Raspberry
Pi's so we demonstrate connectivity and viability via Ethernet connections.

To set up the system in a new environment, the website will first tell the
robots to map the building. Each robot will be assigned to some "room" or area
of the building and will proceed to map the area. Specifically, the robot
utilizes its set of sensors and relies on this data in order to follow the
walls of its surroundings until circling back to its origin, and reports the
velocity of each of the wheels.  This allows for the calculation of x,y
coordinates for the walls of the room with respect to the home of the robot.
These coordinates are then processed in order to create a 2-D map of the
area.  Nodes are created within the hallways and a path-finding algorithm like
Dijkstra's algorithm is implemented in order to find the shortest path between
the home of the robot and any input goal location for the robot to deliver to.
If the building using these robots is large enough to use multiple robots,
the time for each robot to arrive at the goal location can be compared and the
robot with shortest travel time will be sent.

The places that the robot is programmed to go to can be entered by the users.
After logging into the cloud website, one can simply look at the map and make
a guess as to the location where delivery is wanted. A GUI representation of the
previously mapped floorplans would allow easy approximation of the goal point
to which a robot can navigate to. Then a simple RFID can be placed at the exact
location the robot should arrive at.  Using the guessed location the robot will
go there and then search for the RFID.  After finding it the robot can store the
coordinates to the website for future use.

While we have written the code to map a room and send the robot to some
place within the room on demand, due to an excess of teams wishing to use a
Roomba we only had access to one for the first 18 hours of HackTech.  We were
able to verify that our wall following algorithm worked before having to
return the robot at 5:30 Saturday but unfortunately the other algorithms
could not be tested on the robot and we could only check that they compile.
