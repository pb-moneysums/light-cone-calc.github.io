var CalcInput = pojo('Ynow', 'Yinf', 's_eq', 's_lower', 's_upper', 's_step','exponential','S1Included','Omega');

// <<=======   Last modified 2022-05-14

function Calculate(input)
{
  var ResultRow = pojo('a','z','Tnow','Y','Dnow','Dthen','Dhor','Dpar','XDpar','Vnow','Vthen','H_t','s', 'OmegaLambdaT', 'OmegaMatterT', 'OmegaRadiationT', 'TemperatureT','rhocrit', 'OmegaTotalT');
  var resultList = [];
           
  // assign the input to local variables.
  var Ynow = input.Ynow;
  var Yinf = input.Yinf;
  var s_eq = input.s_eq;     
  var Omega = input.Omega;     
  var s_lower = input.s_lower;
  var s_upper = input.s_upper;
  var s_step = input.s_step;
      
  var exponential = input.exponential;
  var S1Included = 1; // input.S1Included;
      
  // >>>>>> derived inputs

  if (Yinf < Ynow)
      {
       Yinf = Ynow;
      }
  var Ol = (Ynow / Yinf) * (Ynow / Yinf); 	          // Lambda density parameter
  var Om = (Omega - Ol) * (s_eq + 1) / (s_eq + 2);   // matter density parameter
  var Or = Om / (s_eq + 1);    		  	              // Radiation density parameter
  var Ok = 1 - Om - Or - Ol;                       //curvature density par
  var Ho = 1 / Ynow; 	 	                          // Hubble const now
  var s_lo = 1;
  var s_hi = 1; 
  var ds = 1; // expansion factor step for outputs
  var dsf = 10 // factor for real steps
  s_lo = s_lower;
  s_hi = s_upper; 
  ds = s_step; // expansion factor step for outputs
    
  // <<======================== some input processining and protection

  if (s_hi < 0.01)
  { 
    s_hi = 0.01;
  }
  if (s_lo < 0.01)
  {
    s_lo = 0.01;
  }
  if (ds > 0)      // ds positive, so ds it's number of steps
  {
    if (ds < 1) // ds invalid
    {
      dsf = 1.1; // set to default
    }
    if (!exponential)  //regular number of steps
      {  
        dsf = -(s_hi - s_lo)/(Math.round(Math.abs(ds)));
        S1Included=0;
      }
      else   //  power steps
        {
          if (S1Included  && s_hi > 1 && s_lo < 0.999999)
          {
              hiratio = Math.log(s_hi);
              loratio = Math.log(1/s_lo);
              hiportion = ds*(hiratio/(loratio + hiratio));
              loportion = ds*(loratio/(loratio + hiratio)); 
              dsf = Math.pow(s_hi , 1/Math.round(hiportion));
          }
          else
          {
	          dsf = Math.pow(s_hi / s_lo , 1/Math.round(Math.abs(ds))); 
        	  S1Included=0;
          }
        }
  }
  else if (ds < 0)       // ds is negative, so it's a downstep size
  {    
    if (!exponential)  // addition steps
    {
      dsf = ds ;
      if (ds > -0.01) // not allowed, set to minimum
      {
        dsf = -0.01;
      }
    }
    else  // exponential steps
    {          
      dsf = -ds ;
      if (ds > -1.1) // not allowed, set to safe value
      {
        dsf = 1.1;
      }
     }
  } // end ds processing
    else // ds = 0, so only one step
  {
    exponential = 0;
    S1Included = 0;
    dsf = -s_hi ;
  }
      
  if (s_hi <= s_lo)
  {
    dsf = -s_hi;
    s_lo = 0.01;
  } 
  
  var a_s = 1/s_hi;
  var a_e = 1/s_lo;
  // end input processing =====================================>>
  
  // << ================================= start ouput initialzation
  
  // >>>>>> output variables
  var a = 0;
  var Ta = 0; // time age    
  var Tl = 0; // time lookback
  var T = 0 ; // Time since start
  var Dc = 0; // comoving distance at time t
  var Dp = 0; // proper distance at time t
  var Dtc = 0; // comoving distance now
  var Dte = 0; // comoving distance at end
  var Dtp = 0; // proper distance now    var Hp = 0; // time variable Hubble constant
  var Y = 0;  // Hubble time

  // >>>>>> auxiliary
  var N = 10000000; // Number of fine grain steps
  var pa = 1 / N; // pre-loop 'a' step size
  var da = 100 / N; // fine grain 'a' step size
  var counter = 0; // used in trigger for outputs displays      
  var a_ic = 1/N; 
  var a_ie = N; 
  var s = s_hi; 
  var si = s;
  var ai = a;
  var sf = 0.000001; // fine grain steps
  var qa = 0;
  var Tage = 0;
  var Dnow = 0;
  var Dthen = 0;
  var Dhor = 0;
  var Dpar = 0;
  var Dlum = 0;
  var XDpar = 0;
  var Vnow = 0;
  var Vthen = 0;
  var s_display = s_hi;
  var nn = s_hi;
  var first = 1;
  var rhoConst = 1.7885e+9;  // 3/(8 pi G)
  var secInGy = 3.1536e+16; // seconds in Gy 
  var rhocritNow = rhoConst*(Ho/secInGy)*(Ho/secInGy); // rhoCrit now
  var rhoNow  =  rhocritNow * Omega;
 // var Y = 1/H;

  a =  1;
 //end of ouput initialization ===================================================>>  
 
  //  pre-integration from a = min to 1 (Now)
  while (a_ic <= 1) 
  {   
    pa = a_ic * sf;          
    a = a_ic ; 
    qa = Math.sqrt((Om / a) + Ok + (Or / (a * a)) + (Ol * a * a)); // time variable density function: qa = Omega (a) = a * H 
    Tage = Tage + (pa / qa / Ho);              // time (age)  T = 1/Ho int da/(a * H)
    Dc = Dc + ((1 / (Ho * a * qa)) * pa);   // proper radius of obs univ as f(a). Dc = 1/Ho Int_0^1 {pa/(a*a*H)}
    a_ic = a_ic + pa;  // new a
  }
  Dtc = Dc; // Proper radius of the observable universe now
  a =  1;
  a_ic = a_ic*1;
  Tage = Tage*1;
 //----------------------------------------   
  // pre-integration from a = 1 to max ('infinity')
  while (a_ic < 100*N) 
  {
    pa = a_ic * sf;
    qa = Math.sqrt((Om / a) + Ok + (Or / (a * a)) + (Ol * a * a)); // time variable density function: qa = Omega (a) = a * H 
    Dc = Dc + ((1 / (Ho * a * qa)) * pa);   // proper radius of obs univ as f(a). Dc = 1/Ho Int_0^1 {pa/(a*a*H)}
    a_ic = a_ic + pa;  // new a
  }
  Dte = Dc; // store for later use 
 //----------------------------------------   

 //================================================================================= 
  
 //<===== Start of main ouput loop from s = earliest possible to latest required
  a_ic = 1/N; Dc = 0; Dp = 0; // Reset accumulators 

  while (s >= 0.9999*s_lo )  
  {   
      a = a_ic; 
      s = 1/a ; z = s-1 ; si = s ; ai = a ; // equivalents 
    
      qa = Math.sqrt((Om / a) + Ok + (Or / (a * a)) + (Ol * a * a)); // time varying density function: Omega (a) =  a * H
      T = T + (da / qa / Ho);              // time (age)  T = 1/Ho int da/(a * H)
      Dc = Dc + 1 / (Ho * a * qa) * da;   // proper radius of obs univ then: Dc = 1/Ho Int_0^a {pa/(a*a*H)}
      da = a_ic * sf;
      
      if (s <= s_display)  
      {
          s = s_display;
          
        if (!exponential)  //regular steps // 
        {  
            s_display = s + dsf ;
        }
        else   // power steps
        {
              if (s <= 1 && s_lo < 0.9999 && first)
              {
                  if(S1Included)
                  {
                    dsf = Math.pow(s / s_lo , 1/Math.round(loportion));
                  }
                   else
                  {
                    dsf = Math.pow(s / s_lo , 1/Math.round(Math.abs(ds)));
                  }
                    
                  first =  0;
              }
              s_display = s/dsf ;
          }
          a = 1/s;
          z = s - 1;	 // redshift  

          H = s * qa * Ho;
          Y = 1 / H;    // Hubble time
          Tnow = T;
       
          Dnow =  Math.abs(Dtc-Dc); // Comoving distance now
          Dthen = a * Dnow;

          if (Math.abs(a-1) < 0.000001)
          {
             z = z + 1e-3;
             Dnow = 0;
             Dthen = 0;
          }              

          Dpar = a * Dc;
          H_t =  1/Y ;
          XDpar = a * H * Ynow;  
          Vnow = Dnow  * Ho ; 
          Vthen = Vnow * XDpar ;

          rholNow = rhocritNow * Ol;
          rhol = rholNow;
          rhomNow = rhoNow - rhol;
          rhom = rhomNow *s*s*s;
          rhorNow = rhomNow/s_eq;
          rhor = rhorNow *s*s*s*s;
          rhoT = rhol+rhom+rhor;  //  this is total rho at time T        
          rhocrit = rhoConst*(H_t/secInGy)*(H_t/secInGy); // critical density at time T
          
          OmegaMatterT = rhom/rhocrit; 
          OmegaLambdaT = rhol/rhocrit; 
          OmegaRadiationT = rhor/rhocrit; 
          OmegaTotalT = OmegaMatterT + OmegaLambdaT + OmegaRadiationT; 
          
          TemperatureT = 2.725 * s;  
                 
          if (Dhor < Y)
              Dhor = Y ;
                      
          var result = ResultRow();
          
          result.s = s;
          result.a = a;  
          result.z = z-1e-3;
          result.Vnow = Vnow;
          result.Vthen = Vthen;
          result.Tnow = Tnow;
          result.Y = Y;
          result.Dnow  = Dnow;
          result.Dthen = Dthen;
          result.Dhor = Dhor;
          result.XDpar = XDpar;
          result.Dpar = Dpar;
          result.H_t = H_t;
          result.OmegaMatterT = OmegaMatterT;
          result.OmegaLambdaT = OmegaLambdaT;
          result.OmegaRadiationT = OmegaRadiationT;
          result.TemperatureT = TemperatureT;
          result.rhocrit = rhocrit;
          result.OmegaTotalT = OmegaTotalT;
        
          resultList.push(result);
          
      } // end of if block for outputs
      
      if (a_ic > 0.99999999 && a_ic < 1.00000001)  // Time 'now'
      {
        a_ic  = 1 ;// the 'now' line, force z to 0, s and a to 1
        z = 0 ; 
        s = 1 ; 
        a = 1/s ;
        Dtc = Dc; // Proper radius of the observable universe now
      }
      a_ic = a_ic + da;  // new a

  } // end of main ouput loop ==================>
  Dte = Dc ;
            
   return resultList;
} // ==========================> end of Function Calculate

function CalculateTage(input) 
{          
  // assign the input to local variables.
  var Ynow = input.Ynow;
  var Yinf = input.Yinf;
  var s_eq = input.s_eq;     
  var Omega = input.Omega;     
      
  // >>>>>> derived inputs

  if (Yinf < Ynow)
    Yinf = Ynow;

  var Ol = (Ynow / Yinf) * (Ynow / Yinf); 	       // Lambda density parameter
  var Om = (Omega - Ol) * (s_eq + 1) / (s_eq + 2);    // matter density parameter
  var Or = Om / (s_eq + 1);    		  	   //  Radiation density parameter
  var Ok = 1 - Om - Or - Ol;   //curvature density par
  var Ho = 1 / Ynow; 	 	   // Hubble const now
 
  // >>>>>> auxiliary

  var a = 0;
  var N = 10000000; // Number of fine grain steps
  var pa = 1 / N; // pre-loop 'a' step size
  var a_ic = 1/N; 
  var a_ie = N; 
  var sf = 0.00001;
  var qa = 0;

  var Tage = 0;

  //<======== pre-integration from a = min to 1
  while (a_ic < 1) 
  {   
    pa = a_ic * sf;          
    a = a_ic + (pa / 2); // half incremented for average value
    qa = Math.sqrt((Om / a) + Ok + (Or / (a * a)) + (Ol * a * a)); // time variable density function: qa = Omega (a) = a * H 
    Tage = Tage + (pa / qa / Ho);              // time (age)  T = 1/Ho int da/(a * H)
    a_ic = a_ic + pa;  // new a
  }
  return Tage;
} // ===========> end of Tage

function ScaleResults(resultList,input,OutputScaling)
{
  var MegaParsec = 3.262; // 1 Gpc = 3.264 Gly
  var ConversionHo = 978
  
  var Ynow = input.Ynow;
  var Tage = CalculateTage(input);
  
  var Yinf = input.Yinf;
  if (Yinf < Ynow)
    Yinf = Ynow;

  for (var i = 0; i < resultList.length; i++)
  {
    var result = resultList[i];
    
    switch(OutputScaling)
    {
      case "GigaLightyear":
          result.H_t = result.H_t*ConversionHo;
        break;  
      case "Gigaparsec":
          result.Y = result.Y/MegaParsec;
          result.Dnow  = result.Dnow/MegaParsec;
          result.Dthen = result.Dthen/MegaParsec;
          result.Dhor = result.Dhor/MegaParsec;
          result.Dpar = result.Dpar/MegaParsec;
          result.H_t = result.H_t*ConversionHo;
        break;  
      case "Normalized":
          result.Tnow = result.Tnow/Tage;
          result.Y = result.Y/Ynow;
          result.Dnow  = result.Dnow/Ynow;
          result.Dthen = result.Dthen/Ynow;
          result.Dhor = result.Dhor/Ynow;
          result.Dpar = result.Dpar/Ynow;
          result.H_t = result.H_t*Ynow;
          result.H_t = result.H_t*Ynow;
          result.TemperatureT = result.TemperatureT / 2.725 ;  
        break;  
      case "Zeit":
          result.Tnow = result.Tnow/Yinf;
          result.Y = result.Y/Yinf;
          result.Dnow  = result.Dnow/Yinf;
          result.Dthen = result.Dthen/Yinf;
          result.Dhor = result.Dhor/Yinf;
          result.Dpar = result.Dpar/Yinf;
          result.H_t = result.H_t*Yinf;
        break; 
    } 
    
  }
                    
}
