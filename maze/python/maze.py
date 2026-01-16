import random

#top, right, bottom, left

class Coord:
    
    def __init__(self,x,y):
        assert type(x) == int
        assert type(y) == int
        assert x >= 0
        assert y >= 0
        self.x = x
        self.y = y
        
    def getCoord(self):
        return (self.x,self.y)
    
    def getX(self):
        return self.x
    
    def getY(self):
        return self.y
    
    def getTop(self):
        if(self.y == 0):
            return False
        return Coord(self.x,self.y-1)
    
    def getRight(self):
        return Coord(self.x+1,self.y)
    
    def getBottom(self):
        return Coord(self.x,self.y+1)
    
    def getLeft(self):
        if(self.x == 0):
            return False
        return Coord(self.x-1,self.y)
    
    def getDirection(self,coord):
        if(self.getTop() and coord == self.getTop()):
            return "t"
        if(coord == self.getRight()):
            return "r"
        if(coord == self.getBottom()):
            return "b"
        if(self.getLeft() and coord == self.getLeft()):
            return "l"
        return "n"
    
    def __str__(self):
        return(str(self.x)+","+str(self.y))

    def __eq__(self, other):
        return self.x == other.getX() and self.y == other.getY()
    
    def __hash__(self):
        return hash((self.x, self.y))


class Cell:
    
    def __init__(self):
        self.rightWall = True
        self.bottomWall = True
        self.explored = False
        self.pathed = False
    
    def getWalls(self):
        return self.walls
    
    def getRightWall(self):
        return self.rightWall
    
    def getBottomWall(self):
        return self.bottomWall
    
    def breakRightWall(self):
        self.rightWall = False
        
    def breakBottomWall(self):
        self.bottomWall = False

    def getExplored(self):
        return self.explored
    
    def setExplored(self):
        self.explored = True
        
    def unsetExplored(self):
        self.explored = False
        
    def getPathed(self):
        return self.pathed
        
    def setPathed(self):
        self.pathed = True
        
    def __str__(self):
        res = ""
        if(self.bottomWall):
            res += "_"
        else:
            res += " "
        if(self.rightWall):
            res += "|"
        else:
            res += " "
        return res
        
        
class Maze:
    
    def __init__(self,length,height):
        assert type(length) == int
        assert type(height) == int
        assert length > 0
        assert height > 0
        self.length = length
        self.height = height
        self.cells = dict()
        self.outs = []
        for y in range(height):
            for x in range(length):
                self.cells[Coord(x,y)] = Cell()
                
    def getCell(self,coord):
        assert type(coord) == Coord
        return self.cells[coord]
        
    def checkSurround(self,coord):
        res = []
        if(coord.getY()>0 and not self.cells[coord.getTop()].getPathed()):
            res.append(coord.getTop())
        if(coord.getX()<self.length-1 and not self.cells[coord.getRight()].getPathed()):
            res.append(coord.getRight())
        if(coord.getY()<self.height-1 and not self.cells[coord.getBottom()].getPathed()):
            res.append(coord.getBottom())
        if(coord.getX()>0 and not self.cells[coord.getLeft()].getPathed()):
            res.append(coord.getLeft())
        return res
        
    def backtrack(self,coord):
        if(coord.getY()>0 and self.cells[coord.getTop()].getExplored() and not self.cells[coord.getTop()].getBottomWall()):
            return coord.getTop()
        if(coord.getX()<self.length-1 and self.cells[coord.getRight()].getExplored() and not self.cells[coord].getRightWall()):
            return coord.getRight()
        if(coord.getY()<self.height-1 and self.cells[coord.getBottom()].getExplored() and not self.cells[coord].getBottomWall()):
            return coord.getBottom()
        if(coord.getX()>0 and self.cells[coord.getLeft()].getExplored() and not self.cells[coord.getLeft()].getRightWall()):
            return coord.getLeft()
        
    def generate(self):
        edges = self.getEdgeCoordinates()
        outs = random.sample(edges, 2)
        self.outs = outs
        coord = outs[0]
        explored = 1
        self.cells[coord].setExplored()
        self.cells[coord].setPathed()
        while explored < self.length*self.height:
            if(coord.getCoord() == outs[1].getCoord()):
                possibilities = []
            else:
                possibilities = self.checkSurround(coord)
            if(possibilities == []):
                self.cells[coord].unsetExplored()
                coord = self.backtrack(coord)
            else:
                newCoord = random.choice(possibilities)
                direction = coord.getDirection(newCoord)
                if(direction == "t"):
                    self.cells[newCoord].breakBottomWall()
                elif(direction == "r"):
                    self.cells[coord].breakRightWall()
                elif(direction == "b"):
                    self.cells[coord].breakBottomWall()
                elif(direction == "l"):
                    self.cells[newCoord].breakRightWall()
                coord = newCoord
                self.cells[coord].setExplored()
                self.cells[coord].setPathed()
                explored += 1
                
    def __str__(self):
        res = (" _"*(self.length))+"\n"
        for y in range(self.height):
            res+="|"
            for x in range(self.length):
                res+= str(self.cells[Coord(x,y)])
            res += "\n"
        res += "in: "+str(self.outs[0])+"\n"
        res += "out: "+str(self.outs[1])+"\n"
        return res

    def getCells(self):
        return self.cells
    
    def getEdgeCoordinates(self):
        edges = []
        for x in range(self.length):
            edges.append(Coord(x, 0))  # top edge
            edges.append(Coord(x, self.height-1))  # bottom edge
        for y in range(1, self.height-1):
            edges.append(Coord(0, y))  # left edge
            edges.append(Coord(self.length-1, y))  # right edge
        return edges
    
if __name__ == '__main__':
    lab = Maze(15,15)
    lab.generate()
    with open("demo.txt", "w") as f:
        f.write(str(lab))