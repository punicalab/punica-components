import { Module as Layout } from '@/layouts/module';
import { useTranslation } from 'react-i18next';

const Module = () => {
  const { t } = useTranslation();

  return (
    <Layout.Main>
      <Layout.Header title={t('component.listView')} />
      <Layout.Content>
        <punica-row spacing={2}>
          <punica-col xs={12}>
            <punica-row spacing={2}>
              <punica-col xs={12}>
                <punica-list-view>
                  <punica-list-view-item>
                    <punica-typography
                      slot="label"
                      class="session-name"
                      variant="headline6"
                    >
                      sldf lsmflsm flsmflsm k ndkfdfng kndgkdnfk gdngkdn
                    </punica-typography>
                    <i
                      slot="icon"
                      className="fa-light fa-angle-right"
                      aria-hidden="true"
                    ></i>
                  </punica-list-view-item>
                  <punica-list-view-item>
                    <punica-typography
                      slot="label"
                      class="session-name"
                      variant="headline6"
                    >
                      sldf lsmflsm flsmflsm k ndkfdfng kndgkdnfk gdngkdn
                    </punica-typography>
                    <i
                      slot="icon"
                      className="fa-light fa-angle-right"
                      aria-hidden="true"
                    ></i>
                  </punica-list-view-item>
                  <punica-list-view-item>
                    <punica-typography
                      slot="label"
                      class="session-name"
                      variant="headline6"
                    >
                      sldf lsmflsm flsmflsm k ndkfdfng kndgkdnfk gdngkdn
                    </punica-typography>
                    <i
                      slot="icon"
                      className="fa-light fa-angle-right"
                      aria-hidden="true"
                    ></i>
                  </punica-list-view-item>
                  <punica-list-view-item>
                    <punica-typography
                      slot="label"
                      class="session-name"
                      variant="headline6"
                    >
                      sldf lsmflsm flsmflsm k ndkfdfng kndgkdnfk gdngkdn
                    </punica-typography>
                    <i
                      slot="icon"
                      className="fa-light fa-angle-right"
                      aria-hidden="true"
                    ></i>
                  </punica-list-view-item>
                </punica-list-view>
              </punica-col>
              <punica-col xs={12}>
                <punica-list-view enabledivider>
                  <punica-list-view-item>
                    <punica-typography
                      slot="label"
                      class="session-name"
                      variant="headline6"
                      truncate={1}
                    >
                      sldf lsmflsm flsmflsm k ndkfdfng kndgkdnfk gdngkdn
                    </punica-typography>
                    <i
                      slot="icon"
                      className="fa-light fa-angle-right"
                      aria-hidden="true"
                    ></i>
                    <img
                      slot="startAdornment"
                      src="/assets/image.png"
                      width="100%"
                    />
                    <div slot="content">
                      <punica-row spacing={1} wrap="nowrap">
                        <punica-col>
                          <punica-icon>
                            <i
                              className="fa-regular fa-calendar-clock"
                              aria-hidden="true"
                            ></i>
                          </punica-icon>
                        </punica-col>

                        <punica-col>
                          <punica-typography
                            class="session-time"
                            variant="body2"
                            style={{ color: 'var(--text-placeholder)' }}
                          >
                            2024-11-11T21:00:00Z - 2024-11-19T21:00:00Z
                          </punica-typography>
                        </punica-col>
                      </punica-row>
                      <punica-row spacing={1} wrap="nowrap">
                        <punica-col>
                          <punica-icon>
                            <i
                              className="fa-regular fa-map-location-dot"
                              aria-hidden="true"
                            ></i>
                          </punica-icon>
                        </punica-col>

                        <punica-col>
                          <punica-typography
                            class="session-location"
                            variant="body2"
                            style={{ color: 'var(--text-placeholder)' }}
                          ></punica-typography>
                        </punica-col>
                      </punica-row>
                    </div>
                  </punica-list-view-item>
                  <punica-list-view-item>
                    <punica-typography
                      slot="label"
                      class="session-name"
                      variant="headline6"
                      truncate={1}
                    >
                      sldf lsmflsm flsmflsm k ndkfdfng kndgkdnfk gdngkdn
                    </punica-typography>
                    <i
                      slot="icon"
                      className="fa-light fa-angle-right"
                      aria-hidden="true"
                    ></i>
                    <img
                      slot="startAdornment"
                      src="/assets/image.png"
                      width="100%"
                    />
                    <div slot="content">
                      <punica-row spacing={1} wrap="nowrap">
                        <punica-col>
                          <punica-icon>
                            <i
                              className="fa-regular fa-calendar-clock"
                              aria-hidden="true"
                            ></i>
                          </punica-icon>
                        </punica-col>

                        <punica-col>
                          <punica-typography
                            class="session-time"
                            variant="body2"
                            style={{ color: 'var(--text-placeholder)' }}
                          >
                            2024-11-11T21:00:00Z - 2024-11-19T21:00:00Z
                          </punica-typography>
                        </punica-col>
                      </punica-row>
                      <punica-row spacing={1} wrap="nowrap">
                        <punica-col>
                          <punica-icon>
                            <i
                              className="fa-regular fa-map-location-dot"
                              aria-hidden="true"
                            ></i>
                          </punica-icon>
                        </punica-col>

                        <punica-col>
                          <punica-typography
                            class="session-location"
                            variant="body2"
                            style={{ color: 'var(--text-placeholder)' }}
                          ></punica-typography>
                        </punica-col>
                      </punica-row>
                    </div>
                  </punica-list-view-item>
                  <punica-list-view-item>
                    <punica-typography
                      slot="label"
                      class="session-name"
                      variant="headline6"
                      truncate={1}
                    >
                      sldf lsmflsm flsmflsm k ndkfdfng kndgkdnfk gdngkdn
                    </punica-typography>
                    <i
                      slot="icon"
                      className="fa-light fa-angle-right"
                      aria-hidden="true"
                    ></i>
                    <img
                      slot="startAdornment"
                      src="/assets/image.png"
                      width="100%"
                    />
                    <div slot="content">
                      <punica-row spacing={1} wrap="nowrap">
                        <punica-col>
                          <punica-icon>
                            <i
                              className="fa-regular fa-calendar-clock"
                              aria-hidden="true"
                            ></i>
                          </punica-icon>
                        </punica-col>

                        <punica-col>
                          <punica-typography
                            class="session-time"
                            variant="body2"
                            style={{ color: 'var(--text-placeholder)' }}
                          >
                            2024-11-11T21:00:00Z - 2024-11-19T21:00:00Z
                          </punica-typography>
                        </punica-col>
                      </punica-row>
                      <punica-row spacing={1} wrap="nowrap">
                        <punica-col>
                          <punica-icon>
                            <i
                              className="fa-regular fa-map-location-dot"
                              aria-hidden="true"
                            ></i>
                          </punica-icon>
                        </punica-col>

                        <punica-col>
                          <punica-typography
                            class="session-location"
                            variant="body2"
                            style={{ color: 'var(--text-placeholder)' }}
                          ></punica-typography>
                        </punica-col>
                      </punica-row>
                    </div>
                  </punica-list-view-item>
                  <punica-list-view-item>
                    <punica-typography
                      slot="label"
                      class="session-name"
                      variant="headline6"
                      truncate={1}
                    >
                      sldf lsmflsm flsmflsm k ndkfdfng kndgkdnfk gdngkdn
                    </punica-typography>
                    <i
                      slot="icon"
                      className="fa-light fa-angle-right"
                      aria-hidden="true"
                    ></i>
                    <img
                      slot="startAdornment"
                      src="/assets/image.png"
                      width="100%"
                    />
                    <div slot="content">
                      <punica-row spacing={1} wrap="nowrap">
                        <punica-col>
                          <punica-icon>
                            <i
                              className="fa-regular fa-calendar-clock"
                              aria-hidden="true"
                            ></i>
                          </punica-icon>
                        </punica-col>

                        <punica-col>
                          <punica-typography
                            class="session-time"
                            variant="body2"
                            style={{ color: 'var(--text-placeholder)' }}
                          >
                            2024-11-11T21:00:00Z - 2024-11-19T21:00:00Z
                          </punica-typography>
                        </punica-col>
                      </punica-row>
                      <punica-row spacing={1} wrap="nowrap">
                        <punica-col>
                          <punica-icon>
                            <i
                              className="fa-regular fa-map-location-dot"
                              aria-hidden="true"
                            ></i>
                          </punica-icon>
                        </punica-col>

                        <punica-col>
                          <punica-typography
                            class="session-location"
                            variant="body2"
                            style={{ color: 'var(--text-placeholder)' }}
                          ></punica-typography>
                        </punica-col>
                      </punica-row>
                    </div>
                  </punica-list-view-item>
                </punica-list-view>
              </punica-col>
            </punica-row>
          </punica-col>
        </punica-row>
      </Layout.Content>
    </Layout.Main>
  );
};

export default Module;
