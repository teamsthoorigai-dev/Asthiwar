'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowDown, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { motion } from 'motion/react';

import { SectionHeading } from '@/components/SiteShell';
import { faqs, services } from '@/data/site';

function NaturalCoolingIcon({ className }: { className?: string }) {
  return (
    <svg width="78" height="78" viewBox="0 0 78 78" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path fillRule="evenodd" clipRule="evenodd" d="M77.2319 48.0201L74.771 53.7037C74.5093 54.3169 73.8023 54.5708 73.2163 54.3169C72.6187 54.0591 72.3453 53.3638 72.5992 52.7661L73.3648 51.0044C68.189 53.7935 63.1618 52.5708 58.5328 48.4575C53.4703 43.9497 48.4778 43.9497 43.2668 48.4653C42.7746 48.8911 42.0285 48.8364 41.6027 48.3443C41.1769 47.8521 41.2316 47.106 41.7238 46.6802C47.8136 41.4029 54.0758 41.3364 60.1028 46.6919C64.5286 50.6138 68.8176 51.1763 73.1458 48.3872L69.8646 47.9731C69.2161 47.8911 68.7591 47.3012 68.8412 46.6528C68.9232 46.0044 69.513 45.5473 70.1615 45.6294L76.4154 46.4224C76.6341 46.4732 77.013 46.7154 77.013 46.7779C77.2396 46.9693 77.3177 47.356 77.3177 47.6372L77.2319 48.0201ZM1.95094 48.4654C1.45875 48.8911 0.712641 48.8364 0.286841 48.3443C-0.138939 47.8521 -0.0842485 47.106 0.407931 46.6802C6.49773 41.4029 12.7599 41.3364 18.7869 46.6919C23.2127 50.6099 27.5017 51.1763 31.8339 48.3872L28.5527 47.9731C27.9043 47.8911 27.4472 47.3013 27.5293 46.6528C27.6114 46.0044 28.2012 45.5473 28.8457 45.6294L34.9707 46.399C35.6739 46.4654 36.2324 47.2505 35.9082 48.0396L33.4551 53.7037C33.1934 54.3052 32.4942 54.5747 31.9043 54.3169C31.3067 54.0591 31.0293 53.3638 31.2871 52.7661L32.0528 51.0044C26.877 53.7935 21.8498 52.5708 17.2208 48.4575C12.1544 43.9458 7.16194 43.9497 1.95094 48.4654ZM9.95484 25.2624L36.6228 2.72736L63.2908 25.2624V36.8244C63.2908 37.3908 62.8299 37.8478 62.2674 37.8478H60.2713C59.7049 37.8478 59.2479 37.3868 59.2479 36.8244V27.6877C59.2479 27.34 59.0956 27.0119 58.83 26.7853L37.385 8.66832C36.9475 8.29723 36.2991 8.29723 35.8616 8.66832L14.4206 26.7853C14.155 27.0119 14.0026 27.34 14.0026 27.6877V36.8244C14.0026 37.3908 13.5417 37.8478 12.9792 37.8478H10.9831C10.4167 37.8478 9.9597 37.3868 9.9597 36.8244L9.95484 25.2624ZM10.9782 40.2114H12.9743C14.8415 40.2114 16.3571 38.6919 16.3571 36.8247V28.2349L36.6191 11.1139L56.8851 28.2349V36.8247C56.8851 38.6919 58.4046 40.2114 60.2679 40.2114H62.264C64.1312 40.2114 65.6468 38.6919 65.6468 36.8247L65.6507 24.7157C65.6507 24.368 65.4984 24.0399 65.2328 23.8133L37.3848 0.278318C36.9473 -0.0927725 36.3028 -0.0927725 35.8614 0.278318L8.01338 23.8133C7.74776 24.0399 7.59541 24.368 7.59541 24.7157V36.8287C7.5915 38.692 9.11104 40.2114 10.9782 40.2114ZM63.2902 75.5664H9.95424V57.8364C9.95424 57.2739 10.4113 56.813 10.9776 56.813H12.9737C13.5402 56.813 13.9971 57.2739 13.9971 57.8364V70.3404C13.9971 70.9927 14.5245 71.5201 15.1768 71.5201L58.0638 71.524C58.7162 71.524 59.2435 70.9966 59.2435 70.3443V57.8363C59.2435 57.2738 59.7006 56.8129 60.2669 56.8129H62.263C62.8255 56.8129 63.2864 57.2738 63.2864 57.8363L63.2902 75.5664ZM62.2629 54.4534H60.2668C58.3996 54.4534 56.884 55.9729 56.884 57.8401V69.1641H16.361V57.8361C16.361 55.9689 14.8415 54.4494 12.9782 54.4494H10.9821C9.11494 54.4494 7.59934 55.9689 7.59934 57.8361V76.7461C7.59934 77.3984 8.12668 77.9258 8.77904 77.9258H64.474C65.1264 77.9258 65.6537 77.3984 65.6537 76.7461L65.6498 57.8361C65.6498 55.9728 64.1301 54.4534 62.2629 54.4534Z" fill="currentColor"/>
    </svg>
  );
}

function LowCementIcon({ className }: { className?: string }) {
  return (
    <svg width="89" height="78" viewBox="0 0 89 78" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M88.01 48.5701C87.6294 47.6672 87.1378 46.8222 86.4453 46.1202L76.7875 36.4624C76.0854 35.7698 75.2404 35.277 74.3375 34.8976C73.4311 34.5289 72.4845 34.2784 71.4988 34.2725H66.7715V37.8179H71.4988C71.812 37.8108 72.4242 37.9385 72.9808 38.1736C73.541 38.3994 74.0634 38.7433 74.2808 38.969L82.7273 47.4155H5.90673L14.3532 38.969C14.5706 38.7433 15.0918 38.3994 15.6532 38.1736C16.2098 37.9373 16.8208 37.8108 17.1352 37.8179H21.8625V34.2725H17.1352C16.1484 34.2784 15.2029 34.5289 14.2965 34.8976C13.3935 35.277 12.5485 35.7698 11.8477 36.4624L2.18991 46.1202C1.49736 46.8222 1.00454 47.6672 0.625181 48.5701C0.255272 49.4766 0.00709091 50.422 0 51.4088V73.8634C0.00709091 76.1514 1.84836 77.9926 4.13636 77.9997H84.5C86.7868 77.9926 88.6293 76.1514 88.6364 73.8634V51.4088C88.6281 50.422 88.3787 49.4766 88.01 48.5701ZM85.0897 73.8634C85.0897 74.0241 85.0271 74.1635 84.9148 74.2794C84.799 74.3916 84.6595 74.4543 84.4988 74.4543H4.13518C3.97327 74.4543 3.835 74.3916 3.71918 74.2794C3.60691 74.1635 3.54427 74.0241 3.54427 73.8634V51.4088C3.54191 51.2954 3.56318 51.137 3.59391 50.9621H85.0401C85.0708 51.1358 85.0921 51.2954 85.0897 51.4088V73.8634Z" fill="currentColor"/>
      <path d="M15.9524 26C14.9739 26 14.1797 26.793 14.1797 27.7727C14.1797 28.7513 14.9739 29.5455 15.9524 29.5455H24.8161V40.7739C24.8161 41.7525 25.6102 42.5466 26.5888 42.5466C27.5673 42.5466 28.3615 41.7525 28.3615 40.7739V29.5455H42.5433V40.7739C42.5433 41.7525 43.3375 42.5466 44.3161 42.5466C45.2946 42.5466 46.0888 41.7525 46.0888 40.7739V29.5455H60.2706V40.7739C60.2706 41.7525 61.0648 42.5466 62.0433 42.5466C63.0219 42.5466 63.8161 41.7525 63.8161 40.7739V29.5455H72.6797C73.6582 29.5455 74.4524 28.7513 74.4524 27.7727C74.4524 26.793 73.6582 26 72.6797 26H63.8161V14.1818H72.6797C73.6582 14.1818 74.4524 13.3876 74.4524 12.4091C74.4524 11.4294 73.6582 10.6364 72.6797 10.6364H63.8161V1.77273C63.8161 0.793 63.0219 0 62.0433 0C61.0648 0 60.2706 0.793 60.2706 1.77273V10.6364H46.0888V1.77273C46.0888 0.793 45.2946 0 44.3161 0C43.3375 0 42.5433 0.793 42.5433 1.77273V10.6364H28.3615V1.77273C28.3615 0.793 27.5673 0 26.5888 0C25.6102 0 24.8161 0.793 24.8161 1.77273V10.6364H15.9524C14.9739 10.6364 14.1797 11.4294 14.1797 12.4091C14.1797 13.3876 14.9739 14.1818 15.9524 14.1818H24.8161V26H15.9524ZM60.2706 14.1818V26H46.0888V14.1818H60.2706ZM28.3615 14.1818H42.5433V26H28.3615V14.1818Z" fill="currentColor"/>
    </svg>
  );
}

function LongTermWellbeingIcon({ className }: { className?: string }) {
  return (
    <svg width="88" height="81" viewBox="0 0 88 81" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M18 45.882V77.835C18 78.3872 18.4477 78.835 19 78.835H69.5C70.0523 78.835 70.5 78.3872 70.5 77.835V45.882C70.5 45.3297 70.9477 44.882 71.5 44.882H85.5876C86.4783 44.882 86.9245 43.8054 86.2951 43.1753L44.7075 1.5432C44.3169 1.15217 43.6831 1.15217 43.2925 1.5432L27.0417 17.8114L15.125 29.7408L1.70491 43.1753C1.07546 43.8054 1.52174 44.882 2.41239 44.882H17C17.5523 44.882 18 45.3297 18 45.882Z" stroke="currentColor" strokeWidth="2.5"/>
      <path d="M30.0234 35.0227L31.3989 33.6472C32.8773 32.1689 34.6094 30.9685 36.5127 30.1034C37.8981 29.4736 39.3599 29.028 40.861 28.7778L41.9239 28.6007C43.3165 28.3686 44.7258 28.252 46.1375 28.252H47.176" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M34.5352 29.5572V30.5085L34.7475 32.6323C34.8975 34.1319 35.7635 35.4663 37.072 36.214C37.7759 36.6162 38.5727 36.8278 39.3835 36.8278H40.2969C41.5541 36.8278 42.7941 36.5351 43.9186 35.9728L45.8197 35.0223L49.3095 33.1188C50.2917 32.583 51.3129 32.122 52.3644 31.7397L54.3163 31.0298C55.0463 30.7644 55.3347 29.8853 54.9039 29.239C54.2696 28.2877 53.4678 27.4596 52.5374 26.795L51.9101 26.3469C51.1619 25.8125 50.3616 25.3551 49.5214 24.9817L47.8306 24.2302C47.0932 23.9025 46.3289 23.6393 45.5461 23.4436L44.9536 23.2955C43.7352 22.9909 42.4723 22.906 41.2242 23.0447L40.4305 23.1328C39.5192 23.2341 38.6382 23.5211 37.8421 23.976L37.7403 24.0341C36.5391 24.7205 35.5945 25.7798 35.0495 27.0514C34.7101 27.8433 34.5352 28.6958 34.5352 29.5572Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M60.7557 34.3478L60.9706 36.2811C61.2016 38.359 61.057 40.4615 60.5437 42.4881C60.17 43.9633 59.6049 45.3833 58.8626 46.7118L58.337 47.6525C57.6484 48.8849 56.8591 50.0583 55.9773 51.1607L55.3286 51.9716" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M61.9263 41.3771L61.1835 40.7829L59.3923 39.6221C58.1277 38.8025 56.5447 38.6452 55.1435 39.1999C54.3896 39.4984 53.7267 39.9884 53.2202 40.6216L52.6496 41.3348C51.8643 42.3166 51.3183 43.4678 51.055 44.6971L50.6097 46.7755L49.9163 50.6897C49.7211 51.7914 49.4432 52.8768 49.085 53.9367L48.42 55.9044C48.1713 56.6402 48.6777 57.4146 49.4515 57.4818C50.5905 57.5808 51.7381 57.4719 52.8382 57.1605L53.58 56.9505C54.4647 56.7001 55.3218 56.3609 56.1382 55.938L57.7812 55.0871C58.4977 54.716 59.1807 54.2835 59.8225 53.7944L60.3082 53.4243C61.3071 52.6631 62.1624 51.73 62.8337 50.6686L63.2606 49.9938C63.7508 49.2189 64.077 48.3517 64.2191 47.4458L64.2372 47.33C64.4515 45.9633 64.2144 44.5639 63.5618 43.344C63.1555 42.5844 62.5991 41.9152 61.9263 41.3771Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M43.3277 58.4356L41.4851 57.8119C39.5048 57.1416 37.6612 56.1207 36.0423 54.7977C34.864 53.8348 33.8167 52.7217 32.9273 51.4868L32.2976 50.6124C31.4725 49.4669 30.7435 48.2551 30.118 46.9896L29.6579 46.0586" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M36.4288 56.8106L37.2815 56.3891L39.0914 55.2576C40.3693 54.4588 41.1818 53.0912 41.2724 51.5869C41.3211 50.7776 41.1577 49.9695 40.7985 49.2427L40.3938 48.4238C39.8367 47.2967 39.0249 46.3148 38.0226 45.5558L36.3281 44.2727L33.0754 41.9876C32.1599 41.3444 31.2942 40.6332 30.4855 39.86L28.9843 38.4246C28.4229 37.8878 27.507 38.0188 27.1185 38.6914C26.5467 39.6814 26.1596 40.7672 25.9761 41.8957L25.8523 42.6567C25.7047 43.5642 25.6492 44.4843 25.6868 45.403L25.7622 47.2517C25.7952 48.0579 25.8979 48.8598 26.0693 49.6483L26.199 50.245C26.4658 51.4722 26.9492 52.6421 27.6266 53.6996L28.0573 54.372C28.5519 55.1441 29.1994 55.8067 29.96 56.3189L30.0572 56.3843C31.2048 57.1571 32.573 57.5346 33.9544 57.4597C34.8147 57.4131 35.6565 57.1923 36.4288 56.8106Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

function EnvironmentalResponsibilityIcon({ className }: { className?: string }) {
  return (
    <svg width="78" height="78" viewBox="0 0 78 78" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M76.9527 37.7931C71.837 37.1289 66.6816 36.6078 61.5141 36.2148C59.2899 32.6648 55.4143 30.4709 51.2033 30.4709C50.1613 30.4709 49.1192 30.6111 48.0894 30.8853C46.8189 29.4562 45.2558 28.3836 43.5282 27.6919C45.6427 24.6448 48.2509 22.0242 51.368 19.94L51.8798 19.5987C52.4405 19.227 52.5928 18.4682 52.218 17.9075C51.8463 17.3468 51.0877 17.1945 50.527 17.5693L50.0121 17.9106C49.0676 18.5413 48.1657 19.2178 47.3034 19.9339C47.4984 19.0624 47.8244 18.2519 48.3058 17.5205C49.9572 14.9366 53.0985 13.6141 56.1152 14.2205L59.4911 14.9061L58.8056 18.2945C58.4095 20.2629 57.273 21.9572 55.6002 23.0633C53.9275 24.1755 51.9165 24.5625 49.9361 24.1633L49.0099 23.9805C48.3487 23.8464 47.7088 24.2791 47.5779 24.9404C47.4468 25.6016 47.8764 26.2415 48.5376 26.3725L49.4578 26.5554C50.1281 26.6925 50.7985 26.7595 51.4657 26.7595C53.4035 26.7595 55.2987 26.1927 56.947 25.0958C59.162 23.6271 60.6672 21.3813 61.1913 18.776L62.1175 14.1931C62.2516 13.5319 61.825 12.8889 61.1669 12.758L56.5935 11.8316C52.5929 11.0241 48.4339 12.7854 46.2554 16.1952C45.579 17.2251 45.1097 18.3769 44.8599 19.6232L44.1987 22.9018C43.0348 24.1725 41.9714 25.5376 41.0178 26.9911C40.7557 26.9485 40.4937 26.8997 40.2286 26.8753V21.2229L43.047 18.4043C47.1481 14.3028 47.1481 7.63235 43.047 3.53466L39.8691 0.356517C39.3938 -0.118839 38.6229 -0.118839 38.1446 0.356517L34.9668 3.53466C30.8657 7.63609 30.8657 14.3066 34.9668 18.4043L37.7851 21.2229V26.8753C37.5201 26.9027 37.258 26.9484 36.996 26.9911C36.0423 25.5346 34.9821 24.1695 33.8151 22.9018L33.1539 19.6232C32.9041 18.3768 32.4349 17.222 31.7676 16.2073C29.58 12.7824 25.421 11.0242 21.417 11.8286L16.8467 12.7549C16.1886 12.889 15.762 13.5319 15.896 14.1901L16.8223 18.773C17.3463 21.3782 18.8546 23.624 21.0696 25.0927C22.721 26.1897 24.6162 26.7565 26.5509 26.7565C27.2151 26.7565 27.8854 26.6894 28.5527 26.5554L29.479 26.3725C30.1401 26.2415 30.5697 25.6016 30.4387 24.9404C30.3077 24.2792 29.6679 23.8465 29.0067 23.9805L28.0744 24.1634C26.1001 24.5625 24.0921 24.1725 22.4164 23.0603C20.7467 21.9511 19.6071 20.2569 19.211 18.2884L18.5255 14.9L21.9014 14.2144C24.9239 13.605 28.0622 14.9335 29.7225 17.5297C30.1947 18.2488 30.5177 19.0593 30.7157 19.9308C29.8534 19.2147 28.9485 18.5382 28.004 17.9044L27.4921 17.5631C26.9284 17.1883 26.1728 17.3407 25.8011 17.9014C25.4263 18.462 25.5786 19.2177 26.1392 19.5925L26.6481 19.9338C29.765 22.0181 32.3731 24.6386 34.4879 27.6857C32.7603 28.3774 31.1972 29.45 29.9266 30.8792C28.8968 30.6019 27.8548 30.4648 26.8127 30.4648C22.602 30.4648 18.7234 32.6587 16.5019 36.2086C11.3344 36.6047 6.17939 37.1258 1.06337 37.787C0.457049 37.8662 0 38.3842 0 38.9967C0 60.4883 17.5102 78 39 78C60.5046 78 78 60.5031 78 38.9967C78 38.3842 77.546 37.8662 76.9366 37.787L76.9527 37.7931ZM36.5417 44.8016L34.7988 37.8267C44.9872 37.6804 55.1888 38.0674 65.3194 38.9785L63.1318 43.9057C62.7814 44.6949 62.0318 45.2434 61.1726 45.3379L52.2877 46.3251C52.0378 46.3525 51.8002 46.4592 51.6113 46.6237L42.0048 55.1647C41.435 55.6705 40.652 55.8807 39.9085 55.7345L38.5405 55.4602C37.404 55.2317 36.5814 54.2262 36.5814 53.0683V45.0968C36.5814 44.9962 36.5692 44.8987 36.5448 44.8012L36.5417 44.8016ZM36.7001 16.6825C33.5496 13.5318 33.5496 8.40683 36.7001 5.25848L39.0158 2.94262L41.3314 5.25848C44.4819 8.40924 44.4819 13.5342 41.3314 16.6825L40.2346 17.7795V13.4099C40.2346 12.7364 39.6892 12.191 39.0158 12.191C38.3425 12.191 37.7971 12.7364 37.7971 13.4099V17.7795L36.7001 16.6825ZM29.9695 33.4415C30.4631 33.6091 31.0085 33.4476 31.3285 33.0332C33.187 30.632 35.9902 29.2516 39.0188 29.2516C42.0474 29.2516 44.8505 30.6289 46.7091 33.0332C47.0291 33.4445 47.5745 33.6091 48.068 33.4415C51.7913 32.1708 55.7584 33.3104 58.2993 35.9828C51.8704 35.5623 45.4324 35.349 39.0216 35.349C32.6141 35.349 26.1727 35.5623 19.7439 35.9828C22.2819 33.3104 26.2489 32.1739 29.9752 33.4415H29.9695ZM12.4991 64.1441L16.6184 61.2006C17.7245 60.4114 19.1656 60.2987 20.3783 60.905L25.0644 63.2482C25.3051 63.3701 25.5823 63.4067 25.8474 63.3518L30.7803 62.3646C31.35 62.2518 31.9442 62.2762 32.5017 62.4347L36.3591 63.5378C37.9191 63.9826 39.0098 65.43 39.0098 67.0541V75.5647C28.5804 75.5647 19.1596 71.1707 12.4929 64.1406L12.4991 64.1441ZM41.4535 75.4761V67.0537C41.4535 64.3478 39.6376 61.9376 37.0324 61.1941L33.1751 60.091C32.2458 59.8229 31.2556 59.7833 30.3049 59.9752L25.7803 60.8802L21.469 58.7229C19.4428 57.7112 17.0389 57.9002 15.2016 59.2135L10.875 62.3032C5.83549 56.2272 2.71541 48.5031 2.47205 40.0683C12.3469 38.8281 22.316 38.0998 32.3008 37.8743L34.1411 45.2423V53.064C34.1411 55.3799 35.7895 57.3909 38.0594 57.8449L39.4274 58.1192C39.7413 58.1832 40.0581 58.2136 40.375 58.2136C41.5602 58.2136 42.7271 57.7809 43.623 56.9826L52.9401 48.7007L61.4382 47.7561C63.1536 47.5672 64.6526 46.4672 65.3564 44.8918L67.8762 39.218C70.4417 39.4709 73.0041 39.7513 75.5605 40.0713C75.0151 58.927 60.125 74.2389 41.4511 75.4761L41.4535 75.4761Z" fill="currentColor"/>
    </svg>
  );
}

const sustainabilityPrinciples = [
  {
    label: 'Natural Cooling',
    lines: ['Natural Cooling'],
    Icon: NaturalCoolingIcon,
  },
  {
    label: 'Low Cement / Cement Free',
    lines: ['Low Cement /', 'Cement Free'],
    Icon: LowCementIcon,
  },
  {
    label: 'Long-term Well-being',
    lines: ['Long-term', 'Well-being'],
    Icon: LongTermWellbeingIcon,
  },
  {
    label: 'Environmental Responsibility',
    lines: ['Environmental', 'Responsibility'],
    Icon: EnvironmentalResponsibilityIcon,
  },
] as const;

export function ServicesSection() {
  return (
    <section className="services-index section section--mineral">
      <div className="shell">
        <SectionHeading
          eyebrow="Our services"
          title="Five disciplines. One continuous process."
          body="Architecture, interior, construction, structural engineering and green building brought together through one coordinated process."
        />
        <div className="services-index__list">
          {services.map((service) => (
            <Link key={service.slug} href={`/services#${service.slug}`} className="service-row">
              <span>{service.index}</span>
              <h3>{service.title}</h3>
              <p>{service.short}</p>
              <ArrowUpRight size={22} aria-hidden="true" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function SustainabilitySection() {
  return (
    <section className="sustainability-band" aria-labelledby="sustainability-title">
      <div className="sustainability-band__frame">
        <div className="sustainability-band__hero">
          <Image
            src="/images/sustainable.jpg"
            alt="Earthen masonry and a perforated screen shown in direct sunlight"
            fill
            priority
            sizes="100vw"
            className="sustainability-band__hero-image"
          />
          <div className="sustainability-band__hero-scrim" aria-hidden="true" />
          <div className="shell sustainability-band__inner">
            <div className="sustainability-band__copy">
              <p className="eyebrow eyebrow--light">Sustainable by design</p>
              <h2 id="sustainability-title">
                Comfort
                <br />designed in, before
                <br />energy is spent.
              </h2>
              <p>
                Natural cooling, lower-carbon material choices, and healthier spaces are considered
                before mechanical energy is added.
              </p>
              <div className="sustainability-band__actions">
                <Link href="/cost-calculator" className="button button--outline-light">
                  Cost calculator <ArrowUpRight size={15} aria-hidden="true" />
                </Link>
                
              </div>
            </div>
            
            <div className="sustainability-band__scroll-cue" aria-hidden="true">
              <span>Scroll to explore</span>
              <ArrowDown size={14} />
            </div>
          </div>
        </div>

        <div
          className="sustainability-principles group/track"
          role="group"
          aria-label="Sustainable design principles. The icons move from left to right; hover or focus to pause."
          tabIndex={0}
        >
          <div className="sustainability-principles__track group-hover/track:[animation-play-state:paused] focus-visible:[animation-play-state:paused]">
            {[0, 1].map((copyIndex) => (
              <ul
                key={copyIndex}
                className="sustainability-principles__group"
                aria-hidden={copyIndex === 1 ? true : undefined}
              >
                {sustainabilityPrinciples.map((principle) => {
                  const Icon = principle.Icon;
                  return (
                    <motion.li 
                      key={`${copyIndex}-${principle.label}`}
                      className="group/item relative flex flex-col items-center justify-center p-4 cursor-default text-center min-h-[8.5rem] transition-all duration-300 hover:z-10 group-hover/track:opacity-50 group-hover/track:grayscale-[70%] hover:!opacity-100 hover:!grayscale-0"
                      whileHover={{ 
                        scale: 1.05, 
                        y: -6,
                        backgroundColor: "rgba(255, 255, 255, 0.22)",
                        boxShadow: "0 10px 30px -10px rgba(0,0,0,0.15)",
                      }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      style={{
                        backgroundColor: "rgba(255, 255, 255, 0)",
                        boxShadow: "none",
                        borderRadius: "4px"
                      }}
                    >
                      <motion.span 
                        className="grid place-items-center w-16 h-16 mb-2 text-[#19241d] group-hover/item:text-[#2e7d32] hover:text-[#2e7d32] transition-colors duration-300 drop-shadow-sm"
                        whileHover={{ scale: 1.15, y: -2 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      >
                        <Icon className="w-full h-full object-contain transition-colors duration-300" />
                      </motion.span>
                      <motion.span 
                        className="grid text-[#19241d] group-hover/item:text-[#2e7d32] hover:text-[#2e7d32] font-medium leading-tight text-[0.82rem] transition-colors duration-300"
                      >
                        {principle.lines.map((line) => (
                          <span key={line}>{line}</span>
                        ))}
                      </motion.span>
                    </motion.li>
                  );
                })}
              </ul>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/** Preview of the inputs the full calculator asks for; each row opens /cost-calculator. */
const estimateFields = [
  { label: 'Location', action: 'Select' },
  { label: 'Built-up area', action: 'Enter area' },
  { label: 'Construction quality', action: 'Select' },
] as const;

export function EstimateSection() {
  return (
    <section className="estimate-band section section--clay">
      <div className="shell estimate-band__grid">
        <div className="estimate-band__intro">
          <p className="eyebrow">Cost calculator</p>
          <h2>Understand your budget before you design.</h2>
        </div>
        <div className="estimate-band__panel">
          <ul className="estimate-band__fields">
            {estimateFields.map((field) => (
              <li key={field.label}>
                <Link href="/cost-calculator" className="estimate-field">
                  <span className="estimate-field__label">{field.label}</span>
                  <span className="estimate-field__action">
                    {field.action}
                    <ArrowDownRight size={13} aria-hidden="true" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="estimate-band__figure" aria-label="Indicative construction range">
            <div className="estimate-band__number">
              <span>₹</span>
              <strong>&mdash;</strong>
            </div>
            <p className="estimate-band__label">Estimated project cost</p>
            <p className="estimate-band__note">
              Estimated cost only. Final project cost depends on design, specifications, site
              conditions, materials and project requirements.
            </p>
            <Link href="/cost-calculator" className="button button--primary">
              Calculate your cost <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export function NotesAndQuestions() {
  return (
    <section className="notes-questions section section--paper">
      <div className="shell notes-questions__grid">
        <aside className="client-note">
          <p className="eyebrow">Verified client testimonial</p>
          <blockquote>Verified client testimonial to be added.</blockquote>
          <p>Client details to be confirmed</p>
        </aside>
        <div className="faq-list">
          <p className="eyebrow">FAQ</p>
          <h2>Questions before you begin.</h2>
          <div>
            {faqs.map((faq, index) => (
              <details key={faq.question} name="home-faq">
                <summary>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  {faq.question}
                  <ArrowDown className="faq-list__arrow" size={18} aria-hidden="true" />
                </summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
