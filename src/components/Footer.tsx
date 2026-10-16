import React from 'react';
import Logo from './Logo';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer>
      <div className="footer-grid">
        <div className="footer-brand">
          <Logo />
          <p>
            Precision laser engraving & custom gifting solutions crafted with love in India. We serve individuals,
            businesses and brands nationwide.
          </p>
          <div className="footer-contact">
            <div className="contact-item">
              <span>📍</span> <span>271, Bank Employees' Colony,<br />
              Bhogadi, Mysuru,<br />
              Karnataka 570026</span>
            </div>
            <div className="contact-item">
              <span>📞</span> <span>+91 8095047273</span>
            </div>
          </div>
        </div>

        <div className="footer-col">
          <h4>Shop</h4>
          <ul>
            <li>
              <a href="#">Wood Engravings</a>
            </li>
            <li>
              <a href="#">Acrylic & LED</a>
            </li>
            <li>
              <a href="#">Mirror Items</a>
            </li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Company</h4>
          <ul>
            <li>
              <a href="#">About Us</a>
            </li>

          </ul>
        </div>

      </div>
    </footer>
  );
}
