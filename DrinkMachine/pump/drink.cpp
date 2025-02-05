#include "drink.h"
#include "sensors.h"
#include "Arduino.h"
#include "time.h"

#define MOSFET_ON 1
#define MOSFET_OFF 0
#define BUTTON_IN 10
#define LED_PUMP_ON 22



//static Calibrations
static DrinkCals WATER_CALS;
static DrinkCals COKE_CALS;
static DrinkCals DIET_COKE_CALS;
static TempCals TEMP_CALS;
static WeightCals WEIGHT_CALS;
unsigned long errors;
static unsigned long start;
//static variables for internal use
Table_Info tableStat;

static bool isDrinkTaken() {
  return true; //(getWeight(4)< WEIGHT_CALS.minCup);
}

static DrinkCals * getDrinkCals() {
  if (tableStat.drinksList[tableStat.currentDrink] == Water) {
     //Serial.println("Water");
     return &WATER_CALS;
  } else if (tableStat.drinksList[tableStat.currentDrink] == Coke) {
    //Serial.println("Coke");
     return &COKE_CALS;
  } else {
     //Serial.println("Diet");
     return &DIET_COKE_CALS;
  }
}
static void determineState(Drink * pDrink) {
  
  switch (pDrink->state) {
    case Waiting_For_Button:
        if (digitalRead(BUTTON_IN)){
          pDrink->state = Pouring_On;
           digitalWrite(LED_PUMP_ON,1);
        }
    break;
    case Getting_Table:
      //Serial.print("Getting Table\n");
      if (tableStat.totalDrinks != 0) {
        //reset parameters and begin to poor the first drink
        tableStat.currentDrink = 0;
        tableStat.drinkFilled = false;
        tableStat.currentOnTime = 0.0f;
        pDrink->state = Waiting_For_Button;
        start = millis();
      }
      break;
    case Pouring_On:
      pDrink->state = Pouring_Off;
      break;

    case Pouring_Off:
      //if ((millis()-start) < WEIGHT_CALS.timeOut){
      //   errors |= TankLeak;
      //   pDrink->state = Waiting_For_Button;
      //   return;
      //}
      if (tableStat.drinkFilled) {
        pDrink->state = Drink_Done;
      } else if (!pDrink->errors) {
        pDrink->state = Pouring_On;
      }
      break;
    case Drink_Done:
     //Serial.println("Drink Done");
     if (isDrinkTaken()) {
        //wait 10 seconds for the person to get out of the way
        //reset parameters and move to the next drink
        tableStat.currentOnTime = 0.0f;
        tableStat.currentDrink++;
         if (tableStat.currentDrink >= tableStat.totalDrinks) {
            pDrink->state = Table_Done;
            tableStat.totalDrinks =0;
          }else{
            tableStat.drinkFilled = false;
            pDrink->state = Waiting_For_Button;
          }
      }
      break;
    case Table_Done:
      // Serial.println("Table Done");
      pDrink->state = Getting_Table;
      break;
  }
}


static void processState(Drink * pDrink) {
  DrinkCals * pDrinkData;
  switch (pDrink->state) {
    case Getting_Table:
      getTableData(pDrink);
      break;
    case Pouring_On:
      //Setup pointer to the calibrations
      pDrinkData = getDrinkCals();
      //Turn on the pump
      //Serial.println("Pump On");
      // Serial.println(pDrinkData->pin);
      digitalWrite(pDrinkData->pin, MOSFET_ON);
        
      //Serial.println(pDrinkData->pin);
      //sleep while the pump does its thing
      //if the drink on time is -1 then pour to completion, else we need to use on time;
      
      if (pDrinkData->onTime_sec < 0.0f) {
        delay(1000.0*pDrinkData->totalFillTime_sec);
        tableStat.currentOnTime = pDrinkData->totalFillTime_sec;
      } else {
        delay(1000.0*pDrinkData->onTime_sec);
        tableStat.currentOnTime += pDrinkData->onTime_sec;
      }
      
      break;

    case Pouring_Off:
      //Serial.println("Pump Off");
      //Setup pointer to the calibrations
      pDrinkData = getDrinkCals();
      //Turn on the pump
      digitalWrite(pDrinkData->pin, MOSFET_OFF);
      //sleep to wait for fizz

      if(pDrinkData->totalFillTime_sec<=tableStat.currentOnTime){
        tableStat.drinkFilled = true;
         digitalWrite(LED_PUMP_ON,0);
      }

      //check for if its complete
      //if (WEIGHT_CALS.minCup< getWeight(4)) {
      //  tableStat.drinkFilled = true;
      //}
      delay(1000.0*pDrinkData->offTime_sec);
      break;
    case Drink_Done:
      break;
    case Table_Done:
      Serial.print('!');
      break;
  }

}


void getTableData(Drink * pDrink) {
    
    int i =0;
    char c = 0;
    if (tableStat.totalDrinks != 0 && errors ==0) {
      return ;
    }
    if (TEMP_CALS.maxTemp < getTempature(TEMP_CALS.pinA) ||
          TEMP_CALS.maxTemp < getTempature(TEMP_CALS.pinB)){
       errors |= DrinkOverTemp;         
    }

   // if (getWeight(1) < WEIGHT_CALS.minWeight||
   //       getWeight(2) < WEIGHT_CALS.minWeight||
   //       getWeight(3) < WEIGHT_CALS.minWeight){
   //    errors |= EmptyTank;         
    //}

    
    boolean drinkNext = false;
    start= millis();
    while (c != 'x'){
      if (Serial.available() > 0) {
        
      c  = Serial.read();
      if (drinkNext){
           tableStat.drinksList[i] =(DrinkTypes) (c - 48);
           i++;
           drinkNext = false;
      }else if (c == 'd'){
           drinkNext = true;
       }else if(c == 'x'){
            tableStat.totalDrinks = i;
          
        }  
      
      }
      
  }
  Serial.print(errors);
  errors =0;
}


void processDrinkRequest(Drink * pDrink) {
  determineState(pDrink);
  processState(pDrink);
}

void resetDrink(Drink * pDrink) {
  initDrink(pDrink);
}




void initDrink(Drink * pDrink) {
  
  //Cals
  WATER_CALS.onTime_sec = -1.0f;
  WATER_CALS.offTime_sec =  0.0f;
  WATER_CALS.totalFillTime_sec = 24.5f;
  WATER_CALS.pin = 7;

  COKE_CALS.onTime_sec = -1.0f;
  COKE_CALS.offTime_sec =  0.0f;
  COKE_CALS.totalFillTime_sec = 15.0f;
  COKE_CALS.pin = 8;

  DIET_COKE_CALS.onTime_sec = -1.0f;
  DIET_COKE_CALS.offTime_sec =  0.0f;
  DIET_COKE_CALS.totalFillTime_sec = 15.0f;
  DIET_COKE_CALS.pin = 9;

  TEMP_CALS.maxTemp =15.0f;
  TEMP_CALS.pinA =0;
  TEMP_CALS.pinB =1;

  WEIGHT_CALS.minWeight = 0.375;
  WEIGHT_CALS.minCup = 0.375;
  WEIGHT_CALS.timeOut = 600000;
  pinMode(WATER_CALS.pin, OUTPUT);
  pinMode(COKE_CALS.pin, OUTPUT);
  pinMode(DIET_COKE_CALS.pin, OUTPUT);

  pinMode(BUTTON_IN, INPUT);//Button
  pinMode(LED_PUMP_ON, OUTPUT);//Button
  digitalWrite(WATER_CALS.pin, MOSFET_OFF);
  digitalWrite(COKE_CALS.pin, MOSFET_OFF);
  digitalWrite(DIET_COKE_CALS.pin, MOSFET_OFF);
  //Serial.println("Init");
  tableStat.totalDrinks = 0;
  tableStat.currentDrink = 0;
  tableStat.drinkFilled = false;
  tableStat.currentOnTime = 0.0f;
  pDrink->state = Getting_Table;
  pDrink->errors = NoErrors;

}
