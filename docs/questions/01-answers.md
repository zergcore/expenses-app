Change 1
                                                                                 
  ▎ Q1.1 For the dashboard logo — should it link to /dashboard (stay in app) or  
  ▎ to the public home (/)?
  I'm not sure, what do you recommend?                                                     
  ▎ Q1.2 The public header logo currently uses href="/" (non-localized). Is the  
  ▎ extra redirect acceptable, or should it be replaced with a localized link    
  ▎ using next-intl's Link?
  What would be the best practice in this case? please do that.
                                                                                 
  Change 2                                                  

  ▎ Q2.1 Both fields editable simultaneously (last-focused drives the other), or 
  ▎ just remove readOnly from the result field and let typing in either one 
  ▎ recompute the other?          
  Both fields should be editable, a 2 way computation                                               
  ▎ Q2.2 Keep the swap button or remove it entirely?   
  Keep the swap button, but equally it should be automatic     
                                                                                 
  Change 3
                                                                                 
  ▎ Q3.1 EUR as a third line in the existing monthly chart, or a separate        
  ▎ toggle/chart?
  EUR should be a third line in the existing monthly chart
  ▎ Q3.2 Days with no EUR data (fallback API days) — show gaps in line, or       
  ▎ connect through with connectNulls? 
  Connect the line                                          
  
  Change 4                                                                       
                                                            
  ▎ Q4.1 Should there be a public preview of the history chart on the landing    
  ▎ page, or just a CTA button that redirects unauthenticated users to sign up?
  Yes, there should be a public preview of the history chart on the landing page
  ▎ Q4.2 After clicking the history CTA, send to /register or /login?
  send them to login            
  ▎ Q4.3 After signup, redirect to /rates or stay on /dashboard?
  send them to the dashboard             
                                                                                 
  Change 5                                                                       
                                                                                 
  ▎ Q5.1 Does "daily granularity" mean: (a) pick a specific day and see intraday 
  ▎ data (multiple data points per day, HH:mm X-axis), or (b) something else? The
  ▎  current monthly view already shows one point per day within the month.  
  In the particular case of the USDT, the graph should show the different values the USDT has taken in the day    
  ▎ Q5.2 If intraday: default to today? What range — just selected day, or last 7
  ▎  days of individual data points?    
  What would be the best case scenario?                                         
  
  Change 6                                                                       
                                                            
  ▎ Q6.1 Target sharing channel → dictates aspect ratio. WhatsApp status /       
  ▎ Instagram story = 9:16. Twitter/X = 16:9. Square = 1:1. Which?
  It should ask the user where it is going to be shared and adjust accordingly
  ▎ Q6.2 Client-side (download, no network, works offline) or server-side        
  ▎ (/api/og route, better fonts)?  
  What would this be for? what's the best case scenario?                                             
  ▎ Q6.3 Which rates appear in the image — all five pairs (USDT, USD, EUR, 
  ▎ BTC/USD, BTC/USDT) or only VES-related (USDT, USD, EUR)?  
  USDT, USD and EUR. But there should be a way to select which currency pairs to share                    
  ▎ Q6.4 Where does the share button appear — landing page only, /rates page 
  ▎ only, or both?             
  Only on the rates page                                                  
  ▎ Q6.5 Button action: download file, or native share sheet with download 
  ▎ fallback? 
  Native share sheet with download fallback