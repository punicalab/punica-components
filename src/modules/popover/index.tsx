import { MouseEvent } from 'react';
import { Module as Layout } from '@/layouts/module';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

const Module = () => {
  const { t } = useTranslation();
  const topRef = useRef();
  const bottomRef = useRef();
  const leftRef = useRef();
  const rightRef = useRef();
  const [topPosition, setTopPosition] = useState(null);
  const [bottomPosition, setBottomPosition] = useState(null);
  const [leftPosition, setLeftPosition] = useState(null);
  const [rightPosition, setRightPosition] = useState(null);

  /**
   *
   * @param event
   */
  const handleTopClick = (event: MouseEvent<HTMLElement>) => {
    if (topPosition) {
      setTopPosition(null);
    } else {
      setTopPosition(event.currentTarget.getBoundingClientRect());
    }
  };

  /**
   *
   * @param event
   */
  const handleBottomClick = (event: MouseEvent<HTMLElement>) => {
    if (bottomPosition) {
      setBottomPosition(null);
    } else {
      setBottomPosition(event.currentTarget.getBoundingClientRect());
    }
  };

  /**
   *
   * @param event
   */
  const handleLeftClick = (event: MouseEvent<HTMLElement>) => {
    if (leftPosition) {
      setLeftPosition(null);
    } else {
      setLeftPosition(event.currentTarget.getBoundingClientRect());
    }
  };

  /**
   *
   * @param event
   */
  const handleRightClick = (event: MouseEvent<HTMLElement>) => {
    if (rightPosition) {
      setRightPosition(null);
    } else {
      setRightPosition(event.currentTarget.getBoundingClientRect());
    }
  };

  return (
    <Layout.Main>
      <Layout.Header title={t('component.popover')} />
      <Layout.Content>
        <punica-row gap={16}>
          <punica-col xs={12}>
            <punica-button ref={topRef} onClick={handleTopClick}>
              Top
            </punica-button>
            <punica-popover
              top={topPosition?.top}
              left={topPosition?.left}
              width={topPosition?.width}
              height={topPosition?.height}
              bottom={leftPosition?.bottom}
              placement="top"
              open={Boolean(topPosition)}
            >
              <punica-paper>Popover Top</punica-paper>
            </punica-popover>
          </punica-col>
          <punica-col xs={12}>
            <punica-button ref={bottomRef} onClick={handleBottomClick}>
              Bottom
            </punica-button>
            <punica-popover
              top={bottomPosition?.top}
              left={bottomPosition?.left}
              width={bottomPosition?.width}
              height={bottomPosition?.height}
              bottom={leftPosition?.bottom}
              placement="bottom"
              open={Boolean(bottomPosition)}
            >
              <punica-paper>Popover Bottom</punica-paper>
            </punica-popover>
          </punica-col>
          <punica-col xs={12}>
            <punica-button ref={leftRef} onClick={handleLeftClick}>
              Left
            </punica-button>
            <punica-popover
              top={leftPosition?.top}
              left={leftPosition?.left}
              width={leftPosition?.width}
              height={leftPosition?.height}
              bottom={leftPosition?.bottom}
              placement="left"
              open={Boolean(leftPosition)}
            >
              <punica-paper>Popover Left</punica-paper>
            </punica-popover>
          </punica-col>
          <punica-col xs={12}>
            <punica-button ref={rightRef} onClick={handleRightClick}>
              Right
            </punica-button>
            <punica-popover
              top={rightPosition?.top}
              left={rightPosition?.left}
              width={rightPosition?.width}
              height={rightPosition?.height}
              bottom={leftPosition?.bottom}
              placement="right"
              open={Boolean(rightPosition)}
            >
              <punica-paper>Popover Right</punica-paper>
            </punica-popover>
          </punica-col>
        </punica-row>
      </Layout.Content>
    </Layout.Main>
  );
};

export default Module;
