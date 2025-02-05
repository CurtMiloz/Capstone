import numpy as np
import argparse
import cv2
import math
import picamera
import os
#https://www.raspberrypi.org/documentation/usage/camera/python/README.md
#https://www.pyimagesearch.com/2014/07/21/detecting-circles-images-using-opencv-hough-circles/

class ImageRec():
	def __init__(self, camera):
		#CALS
		self.mid_x = 640.0/2.0
		self.mid_y = 480.0/2.0
		self.end_x = 640*(0.8)
		self.end_y = 480*(0.8)
		self.before_x = 640*(0.2)
		self.before_y = 480*(0.2)
		self.hist = 150.0
		self.camera = camera
		self.camera.exposure_mode = 'antishake'
		self.camera.shutter_speed = int((1.0 / 200.0) * 1000000)
		self.camera.iso = 500

	def isInHist(self, x, y):
		return self.hist > ((self.mid_x - x) ** 2.0 + (self.mid_y - y) ** 2.0) ** 0.5

	def captureImage(self):
		imgName = 'images/ceiling'+str(len(os.listdir('./images')))+'.jpg'
		self.camera.capture(imgName)
		return imgName

	def checkForCircle(self, imgName):
		original = cv2.imread(imgName, 0)
		retval, image = cv2.threshold(original, 50, 255, cv2.cv.CV_THRESH_BINARY)

		el = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
		image = cv2.dilate(image, el, iterations=6)

		cv2.imwrite("dilated.png", image)

		contours, hierarchy = cv2.findContours(
			image,
			cv2.cv.CV_RETR_LIST,
			cv2.cv.CV_CHAIN_APPROX_SIMPLE
		)

		drawing = cv2.imread(imgName)

		circles = []
		for contour in contours:
			area = cv2.contourArea(contour)

			# there is one contour that contains all others, filter it out
			if area > 500:
				continue

			br = cv2.boundingRect(contour)

			m = cv2.moments(contour)
			center = [int(m['m10'] / m['m00']), int(m['m01'] / m['m00']),br[2]]
			circles.append(center)

		return circles

	def getImgCounter(self):
		return len(os.listdir('./images'))

	def test(self):
		print "Capturing Image... "
		# print "Settings: ", self.camera._get_camera_settings()
		name = self.captureImage()
		circles = self.checkForCircle(name)

		print "Name: ", name

		if len(circles):
			# convert the (x, y) coordinates and radius of the circles to integers
	 	
			# loop over the (x, y) coordinates and radius of the circles
			for (x, y, r) in circles:
				print "Circle At: " + str(x) +", "+ str(y)
				print "Radius of: " + str(r)
		else:
			print "No Circle" 
