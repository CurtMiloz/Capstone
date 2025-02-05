import RPi.GPIO as GPIO
import time
#from UltraSonicCheck import *
from slew import *
GPIO.cleanup()
GPIO.setmode(GPIO.BCM)
Motor1A = 18 # set GPIO-18 as Input 1 of the controller IC
Motor1B = 24 # set GPIO-24 as Input 2 of the controller IC
PWM_L = 23
PWM_R = 25
GPIO.setup(Motor1A,GPIO.OUT)
GPIO.setup(Motor1B,GPIO.OUT)
GPIO.setup(PWM_L,GPIO.OUT)
GPIO.setup(PWM_R,GPIO.OUT)
pwmRight=GPIO.PWM(PWM_L,100) # configuring Enable pin means GPIO-04 for PWM
pwmLeft =GPIO.PWM(PWM_R,100) # configuring Enable pin means GPIO-04 for PWM
#UltraSonic = UltraSonic()
slewRate = Slew(1)

def drive(time_Delay,duty):
	slewRate.prev = 0
	GPIO.output(Motor1A,GPIO.HIGH)
	GPIO.output(Motor1B,GPIO.LOW)
	pwmRight.start(0)
	pwmLeft.start(0) # configuring Enable pin means GPIO-04 for PWM
	s = time.time()
	while time.time()-s < time_Delay:
		dutySlewed = slewRate.slewValue(duty)
		pwmRight.ChangeDutyCycle(dutySlewed)
		pwmLeft.ChangeDutyCycle(dutySlewed)
		time.sleep(0.01)
	
	pwmRight.stop()
	pwmLeft.stop()


def turn(time_Delay,duty, turnRight):
	#slewRate.prev = 0
	GPIO.output(Motor1A,GPIO.HIGH)
	GPIO.output(Motor1B,GPIO.HIGH)

	if(turnRight):
		GPIO.output(Motor1A,GPIO.HIGH)
		GPIO.output(Motor1B,GPIO.HIGH)
	else:
		GPIO.output(Motor1A,GPIO.LOW)
		GPIO.output(Motor1B,GPIO.LOW)
	
	pwmRight.start(0)
	pwmLeft.start(0) # configuring Enable pin means GPIO-04 for PWM
	s = time.time()
	while time.time()-s < time_Delay:
		dutySlewed = slewRate.slewValue(duty)
		pwmRight.ChangeDutyCycle(dutySlewed)
		pwmLeft.ChangeDutyCycle(dutySlewed)
		time.sleep(0.01)
	pwmRight.stop()
	pwmLeft.stop()


#drive(1,30)
#drive(3,17)
#turn(1,20,1)
#drive(1.5,10)
#drive(3,15)
#drive(3,15)