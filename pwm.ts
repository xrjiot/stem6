/**
 * 使用此文件来定义自定义函数和图形块。
 * 想了解更详细的信息，请前往 https://makecode.microbit.org/blocks/custom
 */

/**
 * 自定义图形块
 */
const enum ColorList {
    //% block="红"
    red = 1, 
    //% block="绿"
    green = 2,     
    //% block="蓝"
    blue = 3,           
    //% block="黄"
    yellow = 4,     /*R 255  G 255 B 000*/ 
    //% block="青"
    indigo = 5,      /*R 000  G 255 B 255*/ 
    //% block="紫"
    violet = 6,     /*R 255  G 000 B 255*/ 
    //% block="白"
    white = 7,
    //% block="黑"
    black = 8
}

namespace makerbit {
    const PCA9685_ADDRESS = 0x41
    const MODE1 = 0x00
    const MODE2 = 0x01
    const SUBADR1 = 0x02
    const SUBADR2 = 0x03
    const SUBADR3 = 0x04
    const PRESCALE = 0xFE
    const LED0_ON_L = 0x06
    const LED0_ON_H = 0x07
    const LED0_OFF_L = 0x08
    const LED0_OFF_H = 0x09
    const ALL_LED_ON_L = 0xFA
    const ALL_LED_ON_H = 0xFB
    const ALL_LED_OFF_L = 0xFC
    const ALL_LED_OFF_H = 0xFD

    const STP_CHA_L = 2047
    const STP_CHA_H = 4095

    const STP_CHB_L = 1
    const STP_CHB_H = 2047

    const STP_CHC_L = 1023
    const STP_CHC_H = 3071

    const STP_CHD_L = 3071
    const STP_CHD_H = 1023

    const LED_R =   0
    const LED_G =   2
    const LED_B =   1

    let initialized = false
    

    export enum LED { 
        红灯 = 0,
        绿灯 = 1,
        蓝灯 = 2
    }

    export enum MOTOR {
        A = 3,
        B = 14
    }

    export enum MOTOR_Dir { 
        前进 = 0,
        后退 = 1,
    }

    function i2cwrite(addr: number, reg: number, value: number) {
        let buf = pins.createBuffer(2)
        buf[0] = reg
        buf[1] = value
        pins.i2cWriteBuffer(addr, buf)
    }

    function i2cread(addr: number, reg: number) {
        pins.i2cWriteNumber(addr, reg, NumberFormat.UInt8BE);
        let val = pins.i2cReadNumber(addr, NumberFormat.UInt8BE);
        return val;
    }

    function initPCA9685(): void {
        i2cwrite(PCA9685_ADDRESS, MODE1, 0x00)
        setFreq(50);
        for (let idx = 0; idx < 16; idx++) {
            setPwm(idx, 0, 0);
        }
        initialized = true
    }

    function setFreq(freq: number): void {
        // Constrain the frequency
        let prescaleval = 25000000;
        prescaleval /= 4096;
        prescaleval /= freq;
        prescaleval -= 1;
        let prescale = prescaleval; //Math.Floor(prescaleval + 0.5);
        let oldmode = i2cread(PCA9685_ADDRESS, MODE1);
        let newmode = (oldmode & 0x7F) | 0x10; // sleep
        i2cwrite(PCA9685_ADDRESS, MODE1, newmode); // go to sleep
        i2cwrite(PCA9685_ADDRESS, PRESCALE, prescale); // set the prescaler
        i2cwrite(PCA9685_ADDRESS, MODE1, oldmode);
        control.waitMicros(5000);
        i2cwrite(PCA9685_ADDRESS, MODE1, oldmode | 0xa1);
    }

    function setPwm(channel: number, on: number, off: number): void {
        if (channel < 0 || channel > 15)
            return;

        let buf = pins.createBuffer(5);
        buf[0] = LED0_ON_L + 4 * channel;
        buf[1] = on & 0xff;
        buf[2] = (on >> 8) & 0xff;
        buf[3] = off & 0xff;
        buf[4] = (off >> 8) & 0xff;
        pins.i2cWriteBuffer(PCA9685_ADDRESS, buf);
    }


	
	/**
	 * Servo Execute
	 * @param pulse [500-2500] pulse of servo; eg: 1500, 500, 2500
	*/
    //% subcategory="彩灯"
    //% blockId=setRGBled block="彩灯  颜色设为 %ColorValue|色"
    //% weight=85
    export function setRGB(color: ColorList): void {
		if (!initialized) {
            initPCA9685();
        }

        if (color == ColorList.red)
        {
                setPwm(LED_R, 0, (256*16-1));
                setPwm(LED_G, 0, 0);
                setPwm(LED_B, 0, 0);    
        }


        if (color == ColorList.green)
        {
                setPwm(LED_R, 0, 0);
                setPwm(LED_G, 0, (256*16-1));
                setPwm(LED_B, 0, 0);    
        }

        if (color == ColorList.blue)
        {
                setPwm(LED_R, 0, 0);
                setPwm(LED_G, 0, 0);
                setPwm(LED_B, 0, (256*16-1));    
        }

        if (color == ColorList.yellow)
        {
                setPwm(LED_R, 0, (256*16-1));
                setPwm(LED_G, 0, (256*16-1));
                setPwm(LED_B, 0, 0);    
        }

        if (color == ColorList.indigo)
        {
                setPwm(LED_R, 0, 0);
                setPwm(LED_G, 0, (256*16-1));
                setPwm(LED_B, 0, (256*16-1));    
        }
        
        if (color == ColorList.violet)
        {
                setPwm(LED_R, 0, (256*16-1));
                setPwm(LED_G, 0, 0);
                setPwm(LED_B, 0, (256*16-1));    
        }

        if (color == ColorList.white)
        {
                setPwm(LED_R, 0, (256*16-1));
                setPwm(LED_G, 0, (256*16-1));
                setPwm(LED_B, 0, (256*16-1));    
        }

        if (color == ColorList.black)
        {
                setPwm(LED_R, 0, 0);
                setPwm(LED_G, 0, 0);
                setPwm(LED_B, 0, 0);    
        }             

    }

	/**
	 * Servo Execute
	 * @param pulse [500-2500] pulse of servo; eg: 1500, 500, 2500
	*/
    //% subcategory="彩灯"
    //% block="彩灯  颜色设为 $color"
    //% color.shadow="colorNumberPicker"
    export function setColor(color: number) {   
        if (!initialized) {
            initPCA9685();
        }    
        setPwm(LED_R, 0, (color>>16)*16);
        setPwm(LED_G, 0, ((color>>8)&0xff)*16);
        setPwm(LED_B, 0, (color&0xff)*16);        
    }   

	/**
	 * Servo Execute
	 * @param degree [0-180] degree of servo; eg: 90, 0, 180
	*/
    //% subcategory="电机"
    //% blockId=setServoMotor block="电机 方向选择|%channel|角度 %degree"
    //% weight=85
    //% degree.min=0 degree.max=180
    export function ServoMotor(channel: MOTOR,degree: number): void {
		if (!initialized) {
            initPCA9685();
        }
		// 50hz: 20,000 us
        let v_us = (degree * 1800 / 180 + 600); // 0.6 ~ 2.4
        let value = v_us * 4096 / 20000;
        setPwm(channel, 0, value);
    }
	
	/**
	 * Servo Execute
	 * @param pulse [0-19999] pulse of servo; eg: 1500, 500, 2500
	*/
    //% subcategory="电机"
    //% blockId=setServoPulseMotor block="电机 |%ID|方向选择|%MOTOR_Dir|速度设为|%pulse"
    //% weight=85
    //% pulse.min=0 pulse.max=19999
    export function ServoPulseMotor(ID: MOTOR,Dir:MOTOR_Dir,pulse: number): void {
		if (!initialized) {
            initPCA9685();
        }
		// 50hz: 20,000 us
        let value = pulse * 4096 / 20000;    
        if (Dir == MOTOR_Dir.前进) 
        {
            setPwm((ID+MOTOR_Dir.后退), 0, 0);        
        }   
        else
        {
            setPwm((ID+ID+MOTOR_Dir.前进), 0, 0); 
        }

        setPwm((ID+Dir), 0, value);

    }
}
