// Test file for long module names
import { SomeType } from '../build/HamsterJeeton/HamsterJeeton_HamsterJeetonMain';
import { AnotherType } from '../build/HamsterJeeton/HamstlerJeeton_HamsterJeeton';
import { ThirdType } from '../build/HamsterJeeton/HamsterJeeton_VeryLongNameThatShouldTriggerLowerThreshold';
export * from '../build/HamsterJeeton/HamsterJeeton_HamsterJeeton'; 
export * from '../build/HamsterJeeton/HamsterJeeton_SomeWrongName'; 

// Create some fake files/directories structure:
// ../build/HamsterJeeton/HamsterJeeton_HamsterJeetonCore
// ../build/HamsterJeeton/HamsterJeeton_HamsterJeetonUtils
// ../build/HamsterJeeton/HamsterJeeton_MainLogic 