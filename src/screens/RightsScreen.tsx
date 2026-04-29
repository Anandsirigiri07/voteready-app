import { useState } from 'react';
import { useLanguage } from '../LanguageContext';

const RIGHTS = [
  {
    id: 1,
    en: { title: "Name Missing in Electoral Roll?", content: "If your name is missing but you have an EPIC, you cannot vote. You must file Form 6 to register your name in the electoral roll before the next election cut-off." },
    hi: { title: "मतदाता सूची में नाम गायब है?", content: "यदि आपका नाम गायब है, लेकिन आपके पास EPIC है, तो आप वोट नहीं दे सकते। आपको अगले चुनाव कट-ऑफ से पहले मतदाता सूची में अपना नाम दर्ज करने के लिए फॉर्म 6 भरना होगा।" }
  },
  {
    id: 2,
    en: { title: "Right to Secret Ballot & Protection", content: "You have the right to cast your vote in secrecy. If anyone intimidates you or tries to influence your vote inside the booth, you can report it directly to the Presiding Officer." },
    hi: { title: "गुप्त मतदान और सुरक्षा का अधिकार", content: "आपको गुप्त रूप से अपना वोट डालने का अधिकार है। यदि कोई आपको बूथ के अंदर डराता है या प्रभावित करने की कोशिश करता है, तो आप सीधे पीठासीन अधिकारी से शिकायत कर सकते हैं।" }
  },
  {
    id: 3,
    en: { title: "EVM or VVPAT Failure", content: "If the EVM malfunctions or the VVPAT slip does not show your chosen candidate for 7 seconds, report it immediately to the Presiding Officer before leaving the voting compartment." },
    hi: { title: "EVM या VVPAT विफलता", content: "यदि EVM खराब हो जाता है या VVPAT पर्ची 7 सेकंड के लिए आपके चुने हुए उम्मीदवार को नहीं दिखाती है, तो मतदान डिब्बे से बाहर निकलने से पहले पीठासीन अधिकारी को इसकी सूचना दें।" }
  },
  {
    id: 4,
    en: { title: "NOTA (None of the Above)", content: "You have the right to register a negative vote. Pressing the NOTA button signifies you do not support any of the listed candidates. It is located at the bottom of the EVM." },
    hi: { title: "NOTA (इनमें से कोई नहीं)", content: "आपको नकारात्मक वोट दर्ज करने का अधिकार है। NOTA बटन दबाने का मतलब है कि आप किसी भी सूचीबद्ध उम्मीदवार का समर्थन नहीं करते हैं। यह EVM में सबसे नीचे होता है।" }
  },
  {
    id: 5,
    en: { title: "Voting Holiday Entitlement", content: "Under Section 135B of the Representation of the People Act, every registered voter employed in a business, trade, or industrial undertaking is entitled to a paid holiday on polling day." },
    hi: { title: "मतदान अवकाश का अधिकार", content: "लोक प्रतिनिधित्व अधिनियम की धारा 135B के तहत, किसी भी व्यवसाय या औद्योगिक उपक्रम में कार्यरत प्रत्येक पंजीकृत मतदाता मतदान के दिन सवैतनिक अवकाश का हकदार है।" }
  },
  {
    id: 6,
    en: { title: "Challenged Vote Process", content: "If someone has already cast a vote in your name, you have the right to cast a 'Tendered Vote' using a ballot paper provided by the Presiding Officer after proving your identity." },
    hi: { title: "चुनौतीपूर्ण वोट प्रक्रिया", content: "यदि कोई पहले ही आपके नाम पर वोट डाल चुका है, तो आपको अपनी पहचान साबित करने के बाद पीठासीन अधिकारी द्वारा प्रदान किए गए मतपत्र का उपयोग करके 'टेंडर्ड वोट' डालने का अधिकार है।" }
  }
];

export default function RightsScreen() {
  const { lang, t } = useLanguage();
  const [openId, setOpenId] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">{t('nav.rights')}</h2>
      </div>

      <div className="space-y-3" aria-label="List of Voter Rights">
        {RIGHTS.map((right) => {
          const isOpen = openId === right.id;
          return (
            <div key={right.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all">
              <button 
                className="w-full p-4 text-left font-semibold flex justify-between items-center"
                onClick={() => setOpenId(isOpen ? null : right.id)}
                aria-expanded={isOpen}
                aria-controls={`right-content-${right.id}`}
              >
                <span>{right[lang].title}</span>
                <span className={`transform transition-transform text-gray-400 ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true">▼</span>
              </button>
              {isOpen && (
                <div id={`right-content-${right.id}`} className="px-4 pb-4 text-gray-600 text-sm">
                  {right[lang].content}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  );
}
