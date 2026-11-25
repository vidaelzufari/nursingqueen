import * as Haptics from "expo-haptics";
import React from 'react';
import {render,fireEvent,waitFor} from '@testing-library/react-native';
import ScanFood from '../../app/foods/scan';
import {palettes,spacing,radii,typeScale,shadows} from '@/theme/tokens';
const mockTheme={colors:palettes.light,spacing,radii,type:typeScale,shadows,mode:'light'};
const mockRecognize=jest.fn(),mockReplace=jest.fn(),mockCustom=jest.fn((..._args:unknown[])=> 'custom-food'),mockRefresh=jest.fn();
let mockConfigured=true;const mockPicker=jest.fn();
jest.mock('expo-router',()=>({useRouter:()=>({replace:mockReplace})}));
jest.mock('react-i18next',()=>({useTranslation:()=>({t:(key:string,vars?:{number:number})=>key+(vars?.number??''),i18n:{resolvedLanguage:'fr',language:'fr'}})}));
jest.mock('@/theme/ThemeProvider',()=>({useTheme:()=>mockTheme}));
jest.mock('@/components/ScreenBack',()=>({ScreenBack:()=>null}));
jest.mock('@/components/Screen',()=>({Screen:({children}:{children:React.ReactNode})=><>{children}</>}));
jest.mock('@/store/useBabyStore',()=>({useActiveBaby:()=>({id:'qa'})}));
jest.mock('@/store/useFoodStore',()=>({useFoodStore:{getState:()=>({refresh:mockRefresh})}}));
jest.mock('@/db/repositories/foodRepository',()=>({foodRepository:{custom:(...args:unknown[])=>mockCustom(...args)}}));
jest.mock('@/services/foodRecognition',()=>({foodRecognitionConfigured:()=>mockConfigured,recognizeFoodPhoto:(...args:unknown[])=>mockRecognize(...args)}));
jest.mock('expo-image-picker',()=>({MediaTypeOptions:{Images:'Images'},requestCameraPermissionsAsync:async()=>({granted:true}),requestMediaLibraryPermissionsAsync:async()=>({granted:true}),launchCameraAsync:()=>mockPicker(),launchImageLibraryAsync:()=>mockPicker()}));
beforeEach(()=>{jest.clearAllMocks();(Haptics.impactAsync as jest.Mock).mockResolvedValue(undefined);mockConfigured=true;mockPicker.mockResolvedValue({canceled:false,assets:[{uri:'file:///synthetic.jpg',base64:'synthetic'}]});mockRecognize.mockResolvedValue([{name:'Carotte',catalogId:'carrot',certainty:'likely'},{name:'Œuf',catalogId:'egg_as_food',certainty:'uncertain'}]);});
it('does not send a selected photo until Analyze, allows correcting and removing suggestions, then hands off without recording a meal',async()=>{
 const screen=render(<ScanFood/>);
 fireEvent.press(screen.getByText('foodAI.library'));await waitFor(()=>expect(screen.getByLabelText('foodAI.photo')).toBeTruthy());
 expect(mockRecognize).not.toHaveBeenCalled();expect(mockCustom).not.toHaveBeenCalled();
 fireEvent.press(screen.getByText('foodAI.analyze'));await waitFor(()=>expect(screen.getByLabelText('foodAI.food1')).toBeTruthy());
 expect(mockRecognize).toHaveBeenCalledWith('synthetic','fr');expect(mockCustom).not.toHaveBeenCalled();
 fireEvent.changeText(screen.getByLabelText('foodAI.food1'),'Courgette');fireEvent.press(screen.getAllByText('foodAI.remove')[1]!);
 fireEvent.press(screen.getByText('foodAI.continue'));
 expect(mockCustom).not.toHaveBeenCalled();expect(mockReplace).toHaveBeenCalledWith({pathname:'/modals/meal-entry',params:{foods:'["zucchini"]'}});
});
it('offers manual entry when the service is not configured',()=>{
 mockConfigured=false;const screen=render(<ScanFood/>);expect(screen.getByRole('alert')).toBeTruthy();
 fireEvent.press(screen.getByText('foodAI.manual'));expect(mockReplace).toHaveBeenCalledWith('/modals/meal-entry');expect(mockRecognize).not.toHaveBeenCalled();
});
it('preserves manual entry after an analysis fails and never creates a food',async()=>{
 mockRecognize.mockRejectedValue(new Error('limit'));const screen=render(<ScanFood/>);
 fireEvent.press(screen.getByText('foodAI.camera'));await waitFor(()=>expect(screen.getByLabelText('foodAI.photo')).toBeTruthy());fireEvent.press(screen.getByText('foodAI.analyze'));
 await waitFor(()=>expect(screen.getByText('foodAI.limit')).toBeTruthy());expect(mockCustom).not.toHaveBeenCalled();
});
it('handles a cancelled picker without submitting or creating anything',async()=>{
 mockPicker.mockResolvedValue({canceled:true});const screen=render(<ScanFood/>);fireEvent.press(screen.getByText('foodAI.library'));await waitFor(()=>expect(mockPicker).toHaveBeenCalled());expect(screen.queryByLabelText('foodAI.photo')).toBeNull();expect(mockRecognize).not.toHaveBeenCalled();
});
