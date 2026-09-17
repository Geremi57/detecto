from ultralytics import YOLO
import cv2
import torch

model = YOLO("yolo26n.pt")
imagepath = "/home/bocal/Desktop/zone/The Bustling City of Dar es Salaam, Tanzania _ “The city of peace” _ East Africa _ 🌍.mp4"
frame = cv2.VideoCapture(0)



if not frame.isOpened():
    print("Error: Could not open the webcam.")
    exit()


cv2.namedWindow("Show", cv2.WINDOW_NORMAL)

cv2.resizeWindow("Show", 800, 600)

paused = False

while True:

    if not paused:
        ret, frm = frame.read()

        if not ret:
            print("Error reading the frames")
            break
        


        results = model(frm, classes=0, conf=0.3, verbose=False)

        annot = results[0].plot()

        cv2.imshow("Show", annot)

    key = cv2.waitKey(30) & 
    if key == ord('q'):
        break
    elif key == ord(' '):
        paused = not paused 


    # frame.release()
    # cv2.destroyAllWindows()