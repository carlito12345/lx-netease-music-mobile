import { useEffect, useRef, useState } from 'react';
import WebLoginModal, { type WebLoginModalType } from './WebLoginModal';
import WyQrLoginModal, { type WyQrLoginModalType } from './WyQrLoginModal';

export default () => {
  const modalRef = useRef<WebLoginModalType>(null);
  const [visible, setVisible] = useState(false);
  const qrModalRef = useRef<WyQrLoginModalType>(null);
  const [qrVisible, setQrVisible] = useState(false);

  useEffect(() => {
    const handleShow = () => {
      if (visible) {
        modalRef.current?.show();
      } else {
        setVisible(true);
        requestAnimationFrame(() => {
          modalRef.current?.show();
        });
      }
    };

    const handleQrShow = () => {
      if (qrVisible) {
        qrModalRef.current?.show();
      } else {
        setQrVisible(true);
        requestAnimationFrame(() => {
          qrModalRef.current?.show();
        });
      }
    };

    (global.app_event as any).on('showWebLogin', handleShow);
    (global.app_event as any).on('showWyQrLogin', handleQrShow);
    return () => {
      (global.app_event as any).off('showWebLogin', handleShow);
      (global.app_event as any).off('showWyQrLogin', handleQrShow);
    };
  }, [qrVisible, visible]);

  return (
    <>
      {visible ? <WebLoginModal ref={modalRef} /> : null}
      {qrVisible ? <WyQrLoginModal ref={qrModalRef} /> : null}
    </>
  );
};
