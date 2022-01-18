import React from 'react';
import Mist from '../mist';
import './footer.css';
function Footer() {
  return (
    <div>
      <div className="footer-backgroundcolor">
        <footer className="footer-footer">
          {/* <img
            alt="footerLogo"
            className="footer-footerImg"
            src="http://127.0.0.1:5500/client/public/img/footerLogo.png"
          /> */}
          <span className="footer-MemoryRoad">
            MeMo<span className="footer-ryRoad">ryRoad</span>
          </span>
          <span className="footer-footerText">
            <span className="footer-name">김동운</span>{' '}
            <span className="footer-name">노학민</span>{' '}
            <span className="footer-name">양재영</span>{' '}
            <span className="footer-name">이승연</span>
          </span>
        </footer>
      </div>
    </div>
  );
}

export default Footer;
