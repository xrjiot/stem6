// MakerBit blocks supporting a Keyestudio Infrared Wireless Module Kit
// (receiver module+remote controller)


const enum IrButton {

  //% block="1" 
  Number_1 = 0xA2,
  //% block="2"
  Number_2 = 0x62,
  //% block="3"
  Number_3 = 0xE2,
  //% block="4"
  Number_4 = 0x22,
  //% block="5"
  Number_5 = 0x02,
  //% block="6"
  Number_6 = 0xC2,
  //% block="7"
  Number_7 = 0xE0,
  //% block="8"
  Number_8 = 0xA8,
  //% block="9"
  Number_9 = 0x90,
  //% block="*"
  Star = 0x68,
  //% block="0"
  Number_0 = 0x98,
  //% block="#"
  Hash = 0xB0,
    //% block=" "
  Any = -1,
  //% block="▲"
  Up = 0x18,
  //% block=" "
  Unused_2 = -2,
  //% block="◀"
  Left = 0x10,
  //% block="OK"
  Ok = 0x38,
  //% block="▶"
  Right = 0x5A,
  //% block=" "
  Unused_3 = -3,
  //% block="▼"
  Down = 0x4A,
  //% block=" "
  Unused_4 = -4
}


const enum IrButtonAction {
  //% block="按下"
  Pressed = 0,
  //% block="弹开"
  Released = 1
}

namespace makerbit {
  let irState: IrState;
  const MICROBIT_MAKERBIT_IR_MARK_SPACE = 777;
  const MICROBIT_MAKERBIT_IR_BUTTON_PRESSED_ID = 789;
  const MICROBIT_MAKERBIT_IR_BUTTON_RELEASED_ID = 790;

  interface IrState {
    necIr: NecIr;
    activeCommand: number;
  }

  enum NecIrState {
    DetectStartOrRepeat,
    DetectBits
  }

  class NecIr {
    state: NecIrState;
    bitsReceived: uint8;
    commandBits: uint8;
    inverseCommandBits: uint8;
    frequentlyUsedCommands: uint8[];

    constructor(frequentlyUsedCommands: uint8[]) {
      this.reset();
      this.frequentlyUsedCommands = frequentlyUsedCommands;
    }

    reset() {
      this.bitsReceived = 0;
      this.commandBits = 0;
      this.inverseCommandBits = 0;
      this.state = NecIrState.DetectStartOrRepeat;
    }
  /**
   * 红外编码头检测：10000-12500为重复发送头码
   *                12500-14500为正常发送头码     
   * @param pulseToPulse 脉宽周期，微妙为单位
   */
    detectStartOrRepeat(pulseToPulse: number): number {
      if (pulseToPulse < 10000) {
        return 0;
      } else if (pulseToPulse < 12500) {
        this.state = NecIrState.DetectStartOrRepeat;
        return 256;
      } else if (pulseToPulse < 14500) {
        this.state = NecIrState.DetectBits;
        return 0;
      } else {
        return 0;
      }
    }
  /**
   * 校验   
   * @param 
   */
    static calculateCommand(
      commandBits: number,
      inverseCommandBits: number,
      frequentlyUsedCommands: number[]
    ): number {
      const controlBits = inverseCommandBits ^ 0xff;
      if (commandBits === controlBits) {
        return commandBits;
      } else if (frequentlyUsedCommands.indexOf(commandBits) >= 0) {
        return commandBits;
      } else if (frequentlyUsedCommands.indexOf(controlBits) >= 0) {
        return controlBits;
      } else {
        return -1;
      }
    }

  /**
   * 接收到正确的脉宽后，往缓存中推一个BIT   
   * @param 
   */
    pushBit(bit: number): number {
      this.bitsReceived += 1;

      if (this.bitsReceived <= 16) {
        // ignore all address bits
      } else if (this.bitsReceived <= 24) {
        this.commandBits = (this.commandBits << 1) + bit;
      } else if (this.bitsReceived < 32) {
        this.inverseCommandBits = (this.inverseCommandBits << 1) + bit;
      } else if (this.bitsReceived === 32) {
        this.inverseCommandBits = (this.inverseCommandBits << 1) + bit;
        const command = NecIr.calculateCommand(
          this.commandBits,
          this.inverseCommandBits,
          this.frequentlyUsedCommands
        );
        this.reset();
        return command;
      }
      return 0;
    }

  /**
   * 检测红外数据编码部分
   * @param 
   */
    detectBit(pulseToPulse: number): number {
      if (pulseToPulse < 1600) {
        // low bit
        return this.pushBit(0);
      } else if (pulseToPulse < 2700) {
        // high bit
        return this.pushBit(1);
      } else {
        this.reset();
        return -1;
      }
    }

  /**
   * 检测整体的红外编码  
   * @param 
   */
    pushMarkSpace(markAndSpace: number): number {
      switch (this.state) {
        case NecIrState.DetectStartOrRepeat:
          return this.detectStartOrRepeat(markAndSpace);
        case NecIrState.DetectBits:
          return this.detectBit(markAndSpace);
        default:
          return 0;
      }
    }
  }

  /**
   * IO口检测到电压变化时，记录下脉宽周期，当完成一次高低变化时，触发一次 MICROBIT_MAKERBIT_IR_MARK_SPACE 事件，并且把高低变化的时间推送给事件
   * @param 
   */
  function enableIrMarkSpaceDetection(pin: DigitalPin) {
    let mark = 0;
    let space = 0;

    pins.onPulsed(pin, PulseValue.Low, () => {
      // HIGH
      mark = pins.pulseDuration();
    });

    pins.onPulsed(pin, PulseValue.High, () => {
      // LOW
      space = pins.pulseDuration();
      control.raiseEvent(MICROBIT_MAKERBIT_IR_MARK_SPACE, mark + space);
    });
  }

  /**
   * Connects to the IR receiver module at the specified pin.
   * @param pin IR receiver pin, eg: DigitalPin.P0
   */
  //% subcategory="遥控器"
  //% blockId="makerbit_infrared_connect"
  //% block="设置遥控器引脚 %pin"
  //% pin.fieldEditor="gridpicker"
  //% pin.fieldOptions.columns=4
  //% pin.fieldOptions.tooltips="false"
  //% weight=90
  export function connectInfrared(pin: DigitalPin): void {
    if (!irState) {
      irState = {
        necIr: new NecIr([
          0x62,
          0x22,
          0x02,
          0xc2,
          0xa8,
          0x68,
          0x98,
          0xb0,
          0x30,
          0x18,
          0x7a,
          0x10,
          0x38,
          0x5a,
          0x42,
          0x4a,
          0x52
        ]),
        activeCommand: 0
      };

      enableIrMarkSpaceDetection(pin);

      let activeCommand = 0;
      let repeatTimeout = 0;
      const REPEAT_TIMEOUT_MS = 120;

      control.onEvent(
        MICROBIT_MAKERBIT_IR_MARK_SPACE,
        EventBusValue.MICROBIT_EVT_ANY,
        () => {
          const newCommand = irState.necIr.pushMarkSpace(control.eventValue());

          if (newCommand === 256) {
            repeatTimeout = input.runningTime() + REPEAT_TIMEOUT_MS;
          } else if (newCommand > 0 && newCommand !== activeCommand) {
            if (activeCommand !== 0) {
              control.raiseEvent(
                MICROBIT_MAKERBIT_IR_BUTTON_RELEASED_ID,
                activeCommand
              );
            }

            repeatTimeout = input.runningTime() + REPEAT_TIMEOUT_MS;
            irState.activeCommand = newCommand;
            activeCommand = newCommand;
            control.raiseEvent(
              MICROBIT_MAKERBIT_IR_BUTTON_PRESSED_ID,
              newCommand
            );
          } else if (newCommand < 0 && activeCommand !== 0) {
            // Failed to decode command
            irState.activeCommand = 0;
            control.raiseEvent(
              MICROBIT_MAKERBIT_IR_BUTTON_RELEASED_ID,
              activeCommand
            );
            activeCommand = 0;
          }
        }
      );

      control.inBackground(() => {
        while (true) {
          if (activeCommand === 0) {
            basic.pause(REPEAT_TIMEOUT_MS);
          } else {
            const now = input.runningTime();
            if (now > repeatTimeout) {
              // repeat timeout
              irState.activeCommand = 0;
              control.raiseEvent(
                MICROBIT_MAKERBIT_IR_BUTTON_RELEASED_ID,
                activeCommand
              );
              activeCommand = 0;
            } else {
              basic.pause(repeatTimeout - now + 2);
            }
          }
        }
      });
    }
  }

  /**
   * Do something when a specific button is pressed or released on the remote control.
   * @param button the button to be checked
   * @param handler body code to run when event is raised
   */
  //% subcategory="遥控器"
  //% blockId=makerbit_infrared_on_ir_button
  //% block="当遥控器按键|%button|被|%action|时"
  //% button.fieldEditor="gridpicker"
  //% button.fieldOptions.columns=3
  //% button.fieldOptions.tooltips="false"
  //% weight=69
  export function onIrButton(
    button: IrButton,
    action: IrButtonAction,
    handler: () => void
  ) {
    control.onEvent(
      action === IrButtonAction.Pressed
        ? MICROBIT_MAKERBIT_IR_BUTTON_PRESSED_ID
        : MICROBIT_MAKERBIT_IR_BUTTON_RELEASED_ID,
      button === IrButton.Any ? EventBusValue.MICROBIT_EVT_ANY : button,
      () => {
        irState.activeCommand = control.eventValue();
        handler();
      }
    );
  }

  /**
   * Returns true if a specific remote button is currently pressed. False otherwise.
   * @param button the button to be checked
   */
  //% subcategory="遥控器"
  //% blockId=makerbit_infrared_button_pressed
  //% block="当遥控器按键 | %button | 被按下时"
  //% button.fieldEditor="gridpicker"
  //% button.fieldOptions.columns=3
  //% button.fieldOptions.tooltips="false"
  //% weight=67
  export function isIrButtonPressed(button: IrButton): boolean {
    return irState.activeCommand === button;
  }

  /**
   * Returns the code of the IR button that is currently pressed and 0 if no button is pressed.
   */
  //% subcategory="遥控器"
  //% blockId=makerbit_infrared_pressed_button
  //% block="遥控器编码值"
  //% weight=57
  export function pressedIrButton(): number {
    return irState.activeCommand;
  }

  /**
   * Returns the command code of a specific IR button.
   * @param button the button
   */
  //% subcategory="遥控器"
  //% blockId=makerbit_infrared_button
  //% button.fieldEditor="gridpicker"
  //% button.fieldOptions.columns=3
  //% button.fieldOptions.tooltips="false"
  //% block="遥控器按键| %button"
  //% weight=56
  export function irButton(button: IrButton): number {
    return button as number;
  }
}
