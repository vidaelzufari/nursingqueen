import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, ActivityIndicator, Animated, Platform, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { BRAND_MARK_PATH } from './BrandMark';
const AnimatedPath = Animated.createAnimatedComponent(Path);
/** Trace the shared brand geometry, then reveal its fill and wordmark. */
export function LaunchScreen() {
 const {t}=useTranslation();const offset=useRef(new Animated.Value(360)).current;
 const fill=useRef(new Animated.Value(0)).current;const wordmark=useRef(new Animated.Value(0)).current;
 const [reduced,setReduced]=useState<boolean|null>(null);
 useEffect(()=>{let alive=true;void AccessibilityInfo.isReduceMotionEnabled().then(value=>{if(alive)setReduced(value);}).catch(()=>{if(alive)setReduced(true);});const listener=AccessibilityInfo.addEventListener('reduceMotionChanged',setReduced);return()=>{alive=false;listener.remove();};},[]);
 useEffect(()=>{
  if(reduced===null)return;
  if(reduced){offset.setValue(0);fill.setValue(1);wordmark.setValue(1);return;}
  const animation=Animated.sequence([
   Animated.timing(offset,{toValue:0,duration:1400,useNativeDriver:false}),
   Animated.parallel([Animated.timing(fill,{toValue:1,duration:350,useNativeDriver:false}),Animated.timing(wordmark,{toValue:1,duration:350,useNativeDriver:false})]),
  ]);animation.start();return()=>animation.stop();
 },[reduced,offset,fill,wordmark]);
 return <View accessibilityLabel="The Nursing Queen" style={{flex:1,backgroundColor:'#F8F7FB',alignItems:'center',justifyContent:'center'}}>
  <StatusBar style="dark"/>
  {Platform.OS === 'web' ? React.createElement('svg',{width:148,height:148,viewBox:'0 0 72 72','aria-hidden':true},React.createElement('path',{d:BRAND_MARK_PATH,transform:'translate(4 4)',fill:'#953D8B',fillOpacity:reduced?1:0,stroke:'#953D8B',strokeWidth:.7,strokeDasharray:'360 360',strokeDashoffset:reduced?0:360},reduced===false?React.createElement('animate',{attributeName:'stroke-dashoffset',from:360,to:0,dur:'1.4s',fill:'freeze'}):null,reduced===false?React.createElement('animate',{attributeName:'fill-opacity',from:0,to:1,begin:'1.4s',dur:'.35s',fill:'freeze'}):null)) : <Svg width={148} height={148} viewBox="0 0 72 72" accessibilityElementsHidden>
   <AnimatedPath d={BRAND_MARK_PATH} transform="translate(4 4)" fill="#953D8B" fillOpacity={reduced===null?0:fill} stroke="#953D8B" strokeWidth={.7} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="360 360" strokeDashoffset={offset}/>
  </Svg>}
  <Animated.View style={{opacity:wordmark,marginTop:26}}><Text style={{fontSize:23,fontWeight:'600',letterSpacing:.3,color:'#953D8B'}}>The Nursing Queen</Text></Animated.View>
  <ActivityIndicator accessibilityLabel={t('common.loading')} color="#953D8B" size="small" style={{position:'absolute',bottom:54}}/>
 </View>;
}
