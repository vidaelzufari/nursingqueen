import React from 'react';
import {AccessibilityInfo} from 'react-native';
import {render,waitFor} from '@testing-library/react-native';
import {LaunchScreen} from '@/components/LaunchScreen';
jest.mock('react-i18next',()=>({useTranslation:()=>({t:(key:string)=>key})}));
it('shows the brand without motion and cleans up the accessibility listener when reduced motion is enabled',async()=>{
 const remove=jest.fn();const preference=jest.spyOn(AccessibilityInfo,'isReduceMotionEnabled').mockResolvedValue(true);
 const subscription=jest.spyOn(AccessibilityInfo,'addEventListener').mockReturnValue({remove} as unknown as ReturnType<typeof AccessibilityInfo.addEventListener>);
 const view=render(<LaunchScreen/>);await waitFor(()=>expect(view.getByText('The Nursing Queen')).toBeTruthy());view.unmount();expect(remove).toHaveBeenCalledTimes(1);preference.mockRestore();subscription.mockRestore();
});
