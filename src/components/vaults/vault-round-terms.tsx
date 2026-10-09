import { StyleSheet,Text,View } from 'react-native';
import { InterFont } from '@/constants/fonts';
import { DashboardSheetTheme as C } from '@/constants/theme/dashboard';
export function RoundTerms() {
 return <View style={s.section}>
  <Text style={s.copy}>Minimum total funding: 1,000 USDC, including the Captain’s 100. Maximum accepted capital: 30,000 USDC. Crew minimum: 50 USDC.</Text>
  <Text style={s.copy}>Trading starts after the funding deadline if the minimum is met. Capital stays locked during trading. Failed funding returns principal through a claim.</Text>
  <Text style={s.copy}>Crew may cancel their full contribution before funding closes. Captain cancellation closes after the first Crew commitment. No top-ups or emergency exits.</Text>
  <Text style={s.copy}>At final settlement, the Captain earns 10% of positive total net round profit. A 1,000 → 1,200 USDC round pays a 20 USDC fee; the Captain’s 100 investment pays 118 plus that fee. Losses are proportional.</Text>
  <Text style={s.caption}>No creation fee. Paper network cost: 0. Rounding residue remains a recorded liability. These are simulated balances; returns are not guaranteed.</Text>
 </View>;
}

const s=StyleSheet.create({section:{gap:12},copy:{fontFamily:InterFont.regular,fontSize:13,lineHeight:20,color:C.ink},caption:{fontFamily:InterFont.regular,fontSize:12,lineHeight:18,color:C.secondary}});
