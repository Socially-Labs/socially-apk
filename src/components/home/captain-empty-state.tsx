import { LinearGradient } from 'expo-linear-gradient';
import { Plus, Users, ChartNoAxesColumnIncreasing } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { FundVaultIcon } from '@/components/shared/icons/product-icons';
import { AuthButton } from '@/components/shared/motion';
import { BrandFont, InterFont } from '@/constants/fonts';
import { CaptainHomePalette as C } from '@/constants/theme';
export function CaptainEmptyState({ onCreate }: { onCreate:()=>void }) {
 return <LinearGradient colors={C.card} start={{x:0,y:0}} end={{x:1,y:1}} style={s.card} testID="captain-empty-state">
  <View style={s.icon}><FundVaultIcon size={32} color={C.icon}/></View>
  <Text style={s.title} accessibilityRole="header">Your first voyage starts here.</Text>
  <Text style={s.copy}>Create your strategy and practice with virtual funds based on your devnet wallet.</Text>
  <View style={s.steps}>
   <View style={s.step}><View style={s.smallIcon}><FundVaultIcon size={20} color={C.icon}/></View><View style={s.flex}><Text style={s.stepTitle}>Set your course</Text><Text style={s.copy}>Choose your vault’s name and describe your strategy.</Text></View></View>
   <View style={s.step}><View style={s.smallIcon}><Users size={20} color={C.icon}/></View><View style={s.flex}><Text style={s.stepTitle}>Seed your paper vault</Text><Text style={s.copy}>Initialize paper funds from your SOL and USDC, then review your vault.</Text></View></View>
   <View style={s.step}><View style={s.smallIcon}><ChartNoAxesColumnIncreasing size={20} color={C.icon}/></View><View style={s.flex}><Text style={s.stepTitle}>Track your progress</Text><Text style={s.copy}>Track simulated investments, Crew, and trading performance.</Text></View></View>
  </View>
  <AuthButton testID="captain-first-vault" accessibilityRole="button" onPress={onCreate} style={s.button}><Plus size={20} color={C.createInk}/><Text style={s.buttonText}>Create your first vault</Text></AuthButton>
  <Text style={s.note}>Paper trading · 100 paper USDC seed · Your tokens stay in your wallet</Text>
 </LinearGradient>;
}
const s=StyleSheet.create({
 card:{borderRadius:24,borderCurve:'continuous',padding:20,borderWidth:1,borderColor:C.border,boxShadow:C.shadow,gap:14},
 icon:{width:60,height:60,borderRadius:20,backgroundColor:C.iconSurface,alignItems:'center',justifyContent:'center'},
 title:{fontFamily:BrandFont.editorial,fontSize:32,lineHeight:35,color:C.ink},
 copy:{fontFamily:InterFont.regular,fontSize:12,lineHeight:18,color:C.secondary},
 steps:{borderTopWidth:1,borderTopColor:C.line,paddingTop:16,gap:16},step:{flexDirection:'row',gap:12,alignItems:'center'},
 smallIcon:{width:38,height:38,borderRadius:19,backgroundColor:C.iconSurface,alignItems:'center',justifyContent:'center'},flex:{flex:1,gap:3},
 stepTitle:{fontFamily:InterFont.semiBold,fontSize:13,color:C.ink},
 button:{minHeight:50,borderRadius:25,backgroundColor:C.create[1],flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8},
 buttonText:{fontFamily:InterFont.semiBold,fontSize:13,color:C.createInk},note:{fontFamily:InterFont.regular,fontSize:11,lineHeight:17,color:C.secondary,textAlign:'center'},
});
